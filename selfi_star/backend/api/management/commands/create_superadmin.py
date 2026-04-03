from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create initial super admin user'

    def handle(self, *args, **kwargs):
        # Check if superadmin exists
        if User.objects.filter(username='superadmin').exists():
            self.stdout.write(self.style.WARNING('Super admin already exists'))
            return
            
        # Create super admin
        user = User.objects.create_superuser(
            username='superadmin',
            email='superadmin@yourapp.com',
            password='ChangeThisPassword123!',  # Change this!
            first_name='Super',
            last_name='Admin'
        )
        self.stdout.write(self.style.SUCCESS(f'Super admin created: {user.username}'))
