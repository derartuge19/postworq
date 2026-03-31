from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count
from .models import Comment, CommentLike, CommentReply, SavedPost, Reel, UserProfile
from .serializers_extended import CommentSerializer, CommentLikeSerializer, CommentReplySerializer, SavedPostSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'like', 'reply']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = Comment.objects.all()
        reel_id = self.request.query_params.get('reel')
        if reel_id:
            queryset = queryset.filter(reel_id=reel_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(
            user=request.user,
            comment=comment
        )
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': comment.likes_count})
        return Response({'liked': True, 'likes_count': comment.likes_count})
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        comment = self.get_object()
        text = request.data.get('text')
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        reply = CommentReply.objects.create(
            user=request.user,
            comment=comment,
            text=text
        )
        serializer = CommentReplySerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SavedPostViewSet(viewsets.ModelViewSet):
    serializer_class = SavedPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedPost.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        reel_id = request.data.get('reel_id')
        if not reel_id:
            return Response({'error': 'reel_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        reel = get_object_or_404(Reel, id=reel_id)
        saved, created = SavedPost.objects.get_or_create(
            user=request.user,
            reel=reel
        )
        
        if not created:
            saved.delete()
            return Response({'saved': False})
        return Response({'saved': True})

class ProfilePhotoViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        profile = request.user.profile
        photo = request.FILES.get('photo')
        
        if not photo:
            return Response({'error': 'Photo is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.profile_photo = photo
        profile.save()
        
        return Response({
            'profile_photo': profile.profile_photo.url if profile.profile_photo else None
        })
