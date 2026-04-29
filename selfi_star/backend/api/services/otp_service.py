import random
import string
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
import requests


class OTPService:
    """OTP service with rate limiting and Onevas SMS integration"""
    
    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 5
    MAX_ATTEMPTS = 3
    RATE_LIMIT_MINUTES = 60  # 1 OTP per hour per phone number
    
    @classmethod
    def generate_otp(cls):
        """Generate a 6-digit alphanumeric OTP"""
        characters = string.digits  # Only digits for simplicity
        return ''.join(random.choice(characters) for _ in range(cls.OTP_LENGTH))
    
    @classmethod
    def get_rate_limit_key(cls, phone_number):
        """Get cache key for rate limiting"""
        return f'otp_rate_limit:{phone_number}'
    
    @classmethod
    def get_otp_cache_key(cls, phone_number):
        """Get cache key for OTP storage"""
        return f'otp:{phone_number}'
    
    @classmethod
    def get_attempts_key(cls, phone_number):
        """Get cache key for attempt tracking"""
        return f'otp_attempts:{phone_number}'
    
    @classmethod
    def can_send_otp(cls, phone_number):
        """Check if OTP can be sent (rate limiting)"""
        rate_limit_key = cls.get_rate_limit_key(phone_number)
        
        # Check if user has exceeded rate limit
        last_sent = cache.get(rate_limit_key)
        if last_sent:
            return False, f'Please wait before requesting another OTP'
        
        return True, None
    
    @classmethod
    def send_otp(cls, phone_number, application_key):
        """Send OTP via Onevas SMS"""
        can_send, error = cls.can_send_otp(phone_number)
        if not can_send:
            return False, error
        
        # Generate OTP
        otp_code = cls.generate_otp()
        expires_at = timezone.now() + timedelta(minutes=cls.OTP_EXPIRY_MINUTES)
        
        # Store OTP in cache
        cache.set(
            cls.get_otp_cache_key(phone_number),
            {
                'code': otp_code,
                'expires_at': expires_at.isoformat(),
                'attempts': 0
            },
            timeout=cls.OTP_EXPIRY_MINUTES * 60
        )
        
        # Set rate limit
        cache.set(
            cls.get_rate_limit_key(phone_number),
            timezone.now().isoformat(),
            timeout=cls.RATE_LIMIT_MINUTES * 60
        )
        
        # Send SMS via Onevas
        try:
            message = f'Your verification code is: {otp_code}. Valid for {cls.OTP_EXPIRY_MINUTES} minutes.'
            
            url = 'https://onevas.alet.io/api/partnerSms/send'
            payload = {
                'phone_number': phone_number,
                'application_key': application_key,
                'text': message,
                'product_number': '9286'  # Short code
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                return True, f'OTP sent to {phone_number}'
            else:
                # Even if SMS fails, OTP is stored in cache for testing
                return True, f'OTP generated (SMS delivery failed: {response.text})'
        
        except Exception as e:
            # Even if SMS fails, OTP is stored in cache for testing
            return True, f'OTP generated (SMS error: {str(e)})'
    
    @classmethod
    def verify_otp(cls, phone_number, otp_code):
        """Verify OTP"""
        cache_key = cls.get_otp_cache_key(phone_number)
        otp_data = cache.get(cache_key)
        
        if not otp_data:
            return False, 'OTP expired or not found'
        
        # Check expiry
        expires_at = datetime.fromisoformat(otp_data['expires_at'])
        if timezone.now() > expires_at:
            cache.delete(cache_key)
            return False, 'OTP expired'
        
        # Check attempts
        attempts = otp_data.get('attempts', 0)
        if attempts >= cls.MAX_ATTEMPTS:
            cache.delete(cache_key)
            return False, f'Maximum attempts ({cls.MAX_ATTEMPTS}) exceeded'
        
        # Verify code
        if otp_data['code'] != otp_code:
            # Increment attempts
            otp_data['attempts'] = attempts + 1
            cache.set(cache_key, otp_data, timeout=cls.OTP_EXPIRY_MINUTES * 60)
            return False, f'Invalid OTP. {cls.MAX_ATTEMPTS - attempts - 1} attempts remaining'
        
        # OTP verified - delete from cache
        cache.delete(cache_key)
        return True, 'OTP verified successfully'
    
    @classmethod
    def reset_otp(cls, phone_number):
        """Reset OTP for a phone number"""
        cache_key = cls.get_otp_cache_key(phone_number)
        cache.delete(cache_key)
        return True, 'OTP reset'
