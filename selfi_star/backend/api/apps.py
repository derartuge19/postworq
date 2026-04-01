from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        import api.signals
        
        # Create missing user profiles on startup
        from django.contrib.auth.models import User
        from .models import UserProfile
        
        try:
            for user in User.objects.all():
                UserProfile.objects.get_or_create(user=user)
        except Exception as e:
            # Ignore errors during migrations or initial setup
            pass
