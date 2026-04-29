from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User

from .models_subscription import (
    SubscriptionTier, SubscriptionPlan as UserSubscription, SubscriptionPayment, SubscriptionHistory,
    OnevasWebhookLog, PromoCode, UserPromoUsage, SubscriptionFeatureUsage,
    ExpiredSubscriptionAction, TrialPopupLog, SubscriptionCoinTransaction as CoinTransaction, AdminRole, SubscriptionReport
)
from .models import UserProfile
from .telebirr_service import telebirr_service
import requests
import json
import uuid
from datetime import timedelta

# Onevas SMS Configuration
ONEVAS_SMS_URL = "https://onevas.alet.io/api/partnerSms/send"
ONEVAS_APPLICATION_KEY = settings.ONEVAS_APPLICATION_KEY if hasattr(settings, 'ONEVAS_APPLICATION_KEY') else "YOUR_APPLICATION_KEY"
ONEVAS_PRODUCT_NUMBER = settings.ONEVAS_PRODUCT_NUMBER if hasattr(settings, 'ONEVAS_PRODUCT_NUMBER') else "YOUR_PRODUCT_NUMBER"

# App Links (placeholders - update with actual URLs)
WEB_APP_LINK = "https://postworq.onrender.com"
MOBILE_APP_LINK = "https://play.google.com/store/apps/details?id=com.postworq.mobile"


class OnevasWebhookView(APIView):
    """Handle Onevas webhook notifications"""
    permission_classes = [AllowAny]
    
    def send_sms(self, phone_number, text):
        """Send SMS using Onevas API"""
        try:
            payload = {
                "phone_number": phone_number,
                "application_key": ONEVAS_APPLICATION_KEY,
                "text": text,
                "product_number": ONEVAS_PRODUCT_NUMBER
            }
            response = requests.post(ONEVAS_SMS_URL, json=payload, timeout=10)
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to send SMS: {e}")
            return False
    
    def post(self, request, webhook_type):
        """Handle subscription, unsubscription, and renewal webhooks"""
        try:
            payload = request.data
            
            # Log the webhook
            log = OnevasWebhookLog.objects.create(
                webhook_type=webhook_type,
                payload=payload
            )
            
            if webhook_type == 'subscription':
                response = self.handle_subscription(payload, log)
            elif webhook_type == 'unsubscription':
                response = self.handle_unsubscription(payload, log)
            elif webhook_type == 'renewal':
                response = self.handle_renewal(payload, log)
            else:
                response = Response({'error': 'Invalid webhook type'}, status=400)
            
            log.response_status = response.status_code
            log.response_body = response.data if hasattr(response, 'data') else {}
            log.processed = True
            log.save()
            
            return response
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def handle_subscription(self, payload, log):
        """Handle subscription notification from Onevas"""
        phone_number = payload.get('phone_number')
        password = payload.get('password')
        product_number = payload.get('product_number')
        
        # Find user by phone number
        try:
            profile = UserProfile.objects.get(phone_number=phone_number)
            user = profile.user
            user_exists = True
        except UserProfile.DoesNotExist:
            user_exists = False
        
        # Find tier by product number
        try:
            tier = SubscriptionTier.objects.get(product_id=product_number)
        except SubscriptionTier.DoesNotExist:
            return Response({'error': 'Tier not found'}, status=404)
        
        # If user is not registered, send registration link SMS
        if not user_exists:
            registration_message = f"To subscribe to {tier.name} plan, please register first:\n\nWeb App: {WEB_APP_LINK}\nMobile App: {MOBILE_APP_LINK}\n\nAfter registration, you can subscribe to {tier.name} for {tier.duration_type} plan."
            self.send_sms(phone_number, registration_message)
            return Response({'status': 'user_not_registered', 'message': 'Registration link sent via SMS'})
        
        # User exists - proceed with subscription
        # Check if user already has active subscription
        active_sub = UserSubscription.objects.filter(
            user=user,
            status='active'
        ).first()
        
        if active_sub:
            # Update existing subscription
            active_sub.tier = tier
            active_sub.duration_type = tier.duration_type
            active_sub.activate()
            
            # Record history
            SubscriptionHistory.objects.create(
                user=user,
                subscription=active_sub,
                tier=tier,
                action='renewed',
                reason='Subscription renewed via Onevas',
                metadata={'webhook_payload': payload}
            )
            
            # Create payment record
            SubscriptionPayment.objects.create(
                subscription=active_sub,
                user=user,
                amount=tier.price_etb,
                payment_method='onevas',
                duration_type=tier.duration_type,
                period_start=active_sub.start_date,
                period_end=active_sub.end_date or timezone.now() + timedelta(days=tier.duration_days or 30),
                status='completed'
            )
            
            # Update user trial status
            profile.is_trial_user = False
            profile.save()
            
            return Response({'status': 'success', 'message': 'Subscription renewed'})
        
        else:
            # Create new subscription
            with transaction.atomic():
                subscription = UserSubscription.objects.create(
                    user=user,
                    tier=tier,
                    duration_type=tier.duration_type,
                    onevas_phone_number=phone_number,
                    onevas_subscription_id=str(uuid.uuid4()),
                    status='pending'
                )
                
                subscription.activate()
                
                # Record history
                SubscriptionHistory.objects.create(
                    user=user,
                    subscription=subscription,
                    tier=tier,
                    action='created',
                    reason='Subscription created via Onevas',
                    metadata={'webhook_payload': payload}
                )
                
                # Create payment record
                SubscriptionPayment.objects.create(
                    subscription=subscription,
                    user=user,
                    amount=tier.price_etb,
                    payment_method='onevas',
                    duration_type=tier.duration_type,
                    period_start=subscription.start_date,
                    period_end=subscription.end_date or timezone.now() + timedelta(days=tier.duration_days or 30),
                    status='completed'
                )
                
                # Update user trial status
                profile.is_trial_user = False
                profile.save()
            
            # Send SMS confirmation
            duration_text = f"{tier.duration_days} days" if tier.duration_days else tier.duration_type
            confirmation_message = f"You are successfully subscribed to {tier.name} plan for {duration_text}. Thank you for your subscription!"
            self.send_sms(phone_number, confirmation_message)
            
            return Response({'status': 'success', 'message': 'Subscription created'})
    
    def handle_unsubscription(self, payload, log):
        """Handle unsubscription notification from Onevas"""
        phone_number = payload.get('phone_number')
        product_number = payload.get('product_number')
        
        # Find user by phone number
        try:
            profile = UserProfile.objects.get(phone_number=phone_number)
            user = profile.user
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        # Find active subscription
        subscription = UserSubscription.objects.filter(
            user=user,
            status='active'
        ).first()
        
        if not subscription:
            return Response({'error': 'No active subscription found'}, status=404)
        
        # Cancel subscription
        subscription.cancel(reason='User unsubscribed via Onevas (STOP message)')
        
        # Record history
        SubscriptionHistory.objects.create(
            user=user,
            subscription=subscription,
            tier=subscription.tier,
            action='cancelled',
            reason='User unsubscribed via Onevas',
            metadata={'webhook_payload': payload}
        )
        
        # Send SMS confirmation
        cancellation_message = f"Your {subscription.tier.name} subscription has been cancelled. Thank you for using our service!"
        self.send_sms(phone_number, cancellation_message)
        
        return Response({'status': 'success', 'message': 'Subscription cancelled'})
    
    def handle_renewal(self, payload, log):
        """Handle renewal notification from Onevas"""
        phone_number = payload.get('phone_number')
        next_renewal_date = payload.get('nextRenewalDate')
        product_number = payload.get('product_number')
        
        # Find user by phone number
        try:
            profile = UserProfile.objects.get(phone_number=phone_number)
            user = profile.user
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        # Find active subscription
        subscription = UserSubscription.objects.filter(
            user=user,
            status='active'
        ).first()
        
        if not subscription:
            return Response({'error': 'No active subscription found'}, status=404)
        
        # Update next renewal date
        if next_renewal_date:
            from datetime import datetime
            try:
                subscription.next_renewal_date = datetime.strptime(next_renewal_date, '%Y-%m-%d')
                subscription.save()
            except ValueError:
                pass
        
        return Response({'status': 'success', 'message': 'Renewal date updated'})


class SubscriptionTierViewSet(viewsets.ModelViewSet):
    """Manage subscription tiers"""
    permission_classes = [IsAuthenticated]
    
    queryset = SubscriptionTier.objects.filter(is_active=True)
    serializer_class = None  # Add serializer later
    
    def get_queryset(self):
        return super().get_queryset().order_by('sort_order', 'price_etb')
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active tiers"""
        tiers = self.get_queryset()
        data = [{
            'id': str(tier.id),
            'name': tier.name,
            'slug': tier.slug,
            'description': tier.description,
            'duration_type': tier.duration_type,
            'duration_days': tier.duration_days,
            'price_etb': float(tier.price_etb),
            'price_coins': tier.price_coins,
            'onevas_code': tier.onevas_code,
            'short_code': tier.short_code,
            'features': tier.features,
            'privileges': tier.privileges,
        } for tier in tiers]
        return Response(data)


class SubscriptionViewSet(viewsets.ModelViewSet):
    """Manage user subscriptions"""
    permission_classes = [IsAuthenticated]
    
    queryset = UserSubscription.objects.all()
    serializer_class = None  # Add serializer later
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
    
    def list(self, request):
        """Get user's current subscription"""
        subscription = self.get_queryset().filter(status='active').first()
        
        if not subscription:
            # Check if user is in trial
            profile = request.user.profile
            if profile.is_trial_user and profile.trial_end_date and profile.trial_end_date > timezone.now():
                return Response({
                    'status': 'trial',
                    'trial_end_date': profile.trial_end_date.isoformat(),
                    'days_remaining': (profile.trial_end_date - timezone.now()).days
                })
            else:
                return Response({'status': 'no_subscription'})
        
        data = {
            'id': str(subscription.id),
            'tier': {
                'name': subscription.tier.name,
                'duration_type': subscription.tier.duration_type,
                'price_etb': float(subscription.tier.price_etb),
                'privileges': subscription.tier.privileges,
            },
            'status': subscription.status,
            'start_date': subscription.start_date.isoformat(),
            'end_date': subscription.end_date.isoformat() if subscription.end_date else None,
            'next_renewal_date': subscription.next_renewal_date.isoformat() if subscription.next_renewal_date else None,
            'auto_renew': subscription.auto_renew,
        }
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Initiate subscription request"""
        tier_id = request.data.get('tier_id')
        payment_method = request.data.get('payment_method', 'onevas')  # onevas, telebirr, coins
        
        try:
            tier = SubscriptionTier.objects.get(id=tier_id, is_active=True)
        except SubscriptionTier.DoesNotExist:
            return Response({'error': 'Invalid tier'}, status=400)
        
        user = request.user
        profile = user.profile
        
        # Check if user already has active subscription
        active_sub = UserSubscription.objects.filter(user=user, status='active').first()
        if active_sub:
            return Response({'error': 'Already subscribed'}, status=400)
        
        if payment_method == 'onevas':
            # Send Onevas charging request
            response = self.send_onevas_charge(user, tier)
            return response
        
        elif payment_method == 'coins':
            # Check coin balance
            if not tier.price_coins:
                return Response({'error': 'This tier cannot be purchased with coins'}, status=400)
            
            if profile.coins < tier.price_coins:
                return Response({'error': 'Insufficient coins'}, status=400)
            
            # Deduct coins and activate subscription
            with transaction.atomic():
                # Create coin transaction
                CoinTransaction.objects.create(
                    user=user,
                    transaction_type='subscription',
                    amount=-tier.price_coins,
                    balance_after=profile.coins - tier.price_coins,
                    description=f'Subscription: {tier.name}',
                    reference_id=str(tier.id),
                    reference_type='subscription'
                )
                
                # Update profile
                profile.coins -= tier.price_coins
                profile.coins_spent_total += tier.price_coins
                profile.is_trial_user = False
                profile.save()
                
                # Create subscription
                subscription = UserSubscription.objects.create(
                    user=user,
                    tier=tier,
                    duration_type=tier.duration_type,
                    status='pending'
                )
                subscription.activate()
                
                # Record history
                SubscriptionHistory.objects.create(
                    user=user,
                    subscription=subscription,
                    tier=tier,
                    action='created',
                    reason='Purchased with coins',
                    metadata={'payment_method': 'coins', 'amount': tier.price_coins}
                )
                
                # Create payment record
                SubscriptionPayment.objects.create(
                    subscription=subscription,
                    user=user,
                    amount=tier.price_etb,
                    payment_method='coins',
                    duration_type=tier.duration_type,
                    period_start=subscription.start_date,
                    period_end=subscription.end_date or timezone.now() + timedelta(days=tier.duration_days or 30),
                    status='completed'
                )
            
            return Response({'status': 'success', 'message': 'Subscription activated'})
        
        elif payment_method == 'telebirr':
            # Initiate Telebirr payment
            response = self.initiate_telebirr_payment(user, tier)
            return response
        
        else:
            return Response({'error': 'Invalid payment method'}, status=400)
    
    def send_onevas_charge(self, user, tier):
        """Send charging request to Onevas"""
        profile = user.profile
        
        # Onevas charging endpoint
        url = 'https://onevas.alet.io/api/partner/charge'
        
        payload = {
            'application_key': tier.application_key,
            'phone_number': profile.phone_number,
            'product_number': tier.product_id
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                return Response({
                    'status': 'pending',
                    'message': 'Charging request sent. Please confirm via SMS.',
                    'onevas_code': tier.onevas_code,
                    'short_code': tier.short_code
                })
            else:
                return Response({'error': 'Failed to send charging request'}, status=500)
        
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def initiate_telebirr_payment(self, user, tier):
        """Initiate Telebirr payment for subscription"""
        profile = user.profile
        
        try:
            response = telebirr_service.initiate_payment(
                amount=float(tier.price_etb),
                phone_number=profile.phone_number,
                user_id=user.id,
                package_id=tier.id
            )
            
            if response.get('success'):
                # Create pending payment record
                payment = SubscriptionPayment.objects.create(
                    user=user,
                    subscription=None,  # Will be linked after payment success
                    amount=tier.price_etb,
                    currency='ETB',
                    status='pending',
                    payment_method='telebirr',
                    onevas_transaction_id=response.get('transaction_id'),
                    period_start=timezone.now(),
                    period_end=timezone.now() + timedelta(days=tier.duration_days or 30),
                )
                
                return Response({
                    'status': 'pending',
                    'message': 'Payment initiated. Please complete payment via Telebirr.',
                    'payment_url': response.get('payment_url'),
                    'transaction_id': response.get('transaction_id'),
                    'payment_id': str(payment.id)
                })
            else:
                return Response({'error': response.get('error', 'Payment initiation failed')}, status=400)
                
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['post'])
    def unsubscribe(self, request):
        """Cancel subscription"""
        subscription = self.get_queryset().filter(status='active').first()
        
        if not subscription:
            return Response({'error': 'No active subscription'}, status=400)
        
        reason = request.data.get('reason', 'User requested cancellation')
        subscription.cancel(reason=reason)
        
        # Record history
        SubscriptionHistory.objects.create(
            user=request.user,
            subscription=subscription,
            tier=subscription.tier,
            action='cancelled',
            reason=reason
        )
        
        return Response({'status': 'success', 'message': 'Subscription cancelled'})
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get subscription history"""
        history = SubscriptionHistory.objects.filter(user=request.user).order_by('-created_at')
        
        data = [{
            'action': item.action,
            'tier_name': item.tier.name if item.tier else None,
            'reason': item.reason,
            'created_at': item.created_at.isoformat(),
        } for item in history]
        
        return Response(data)


class TrialPopupViewSet(viewsets.ModelViewSet):
    """Track trial popup interactions"""
    permission_classes = [IsAuthenticated]
    
    queryset = TrialPopupLog.objects.all()
    serializer_class = None
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
    
    def create(self, request):
        """Log popup interaction"""
        trigger_action = request.data.get('trigger_action')
        trigger_screen = request.data.get('trigger_screen')
        user_action = request.data.get('user_action')
        
        # Update user profile
        profile = request.user.profile
        profile.trial_interaction_count += 1
        if user_action:
            profile.trial_popup_shown_count += 1
        profile.save()
        
        # Log the popup
        TrialPopupLog.objects.create(
            user=request.user,
            trigger_action=trigger_action,
            trigger_screen=trigger_screen,
            user_action=user_action
        )
        
        return Response({'status': 'success'})


class CoinTransactionViewSet(viewsets.ModelViewSet):
    """Manage coin transactions"""
    permission_classes = [IsAuthenticated]
    
    queryset = CoinTransaction.objects.all()
    serializer_class = None
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-created_at')
    
    def list(self, request):
        """Get user's coin transactions"""
        transactions = self.get_queryset()
        
        data = [{
            'id': str(t.id),
            'transaction_type': t.transaction_type,
            'amount': t.amount,
            'balance_after': t.balance_after,
            'description': t.description,
            'created_at': t.created_at.isoformat(),
        } for t in transactions]
        
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def purchase(self, request):
        """Purchase coins via Telebirr or airtime"""
        amount = request.data.get('amount')  # ETB amount
        payment_method = request.data.get('payment_method', 'telebirr')
        
        # Coin conversion: 10 ETB = 100 coins (1 ETB = 10 coins)
        coins = int(amount * 10)
        
        if payment_method == 'telebirr':
            # Initiate Telebirr payment
            from .telebirr_service import TelebirrService
            
            try:
                telebirr = TelebirrService()
                response = telebirr.create_payment(
                    amount=float(amount),
                    phone_number=request.user.profile.phone_number,
                    description=f'Purchase {coins} coins'
                )
                
                if response.get('success'):
                    return Response({
                        'status': 'pending',
                        'message': f'Purchasing {coins} coins via Telebirr',
                        'payment_url': response.get('payment_url'),
                        'coins': coins
                    })
                else:
                    return Response({'error': response.get('error', 'Payment failed')}, status=500)
            
            except Exception as e:
                return Response({'error': str(e)}, status=500)
        
        else:
            return Response({'error': 'Invalid payment method'}, status=400)


class AdminSubscriptionViewSet(viewsets.ModelViewSet):
    """Admin subscription management"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Check admin permissions
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            return UserSubscription.objects.none()
        
        return UserSubscription.objects.all()
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get subscription analytics"""
        if not self._is_admin(request):
            return Response({'error': 'Unauthorized'}, status=403)
        
        total_subscriptions = UserSubscription.objects.count()
        active_subscriptions = UserSubscription.objects.filter(status='active').count()
        expired_subscriptions = UserSubscription.objects.filter(status='expired').count()
        
        # Revenue calculation
        total_revenue = sum(
            p.amount for p in SubscriptionPayment.objects.filter(status='completed')
        )
        
        # Trial users
        trial_users = UserProfile.objects.filter(is_trial_user=True).count()
        
        # Tier distribution
        tier_distribution = {}
        for tier in SubscriptionTier.objects.all():
            count = UserSubscription.objects.filter(tier=tier, status='active').count()
            tier_distribution[tier.name] = count
        
        data = {
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'expired_subscriptions': expired_subscriptions,
            'total_revenue': float(total_revenue),
            'trial_users': trial_users,
            'tier_distribution': tier_distribution,
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def revenue(self, request):
        """Get revenue reports"""
        if not self._is_admin(request):
            return Response({'error': 'Unauthorized'}, status=403)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        payments = SubscriptionPayment.objects.filter(status='completed')
        
        if date_from:
            from datetime import datetime
            payments = payments.filter(created_at__gte=datetime.fromisoformat(date_from))
        if date_to:
            from datetime import datetime
            payments = payments.filter(created_at__lte=datetime.fromisoformat(date_to))
        
        revenue_by_tier = {}
        for payment in payments:
            tier_name = payment.subscription.tier.name if payment.subscription.tier else 'Unknown'
            revenue_by_tier[tier_name] = revenue_by_tier.get(tier_name, 0) + float(payment.amount)
        
        data = {
            'total_revenue': sum(float(p.amount) for p in payments),
            'revenue_by_tier': revenue_by_tier,
            'payment_count': payments.count(),
        }
        
        return Response(data)
    
    def _is_admin(self, request):
        """Check if user has admin permissions"""
        return request.user.is_staff or request.user.is_superuser
