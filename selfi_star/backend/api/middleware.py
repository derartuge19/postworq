from django.utils.deprecation import MiddlewareMixin

class VideoStreamingMiddleware(MiddlewareMixin):
    """
    Middleware to add proper headers for video streaming
    """
    def process_response(self, request, response):
        # Only apply to video files
        if request.path.startswith('/media/') and any(request.path.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov']):
            response['Accept-Ranges'] = 'bytes'
            response['Cache-Control'] = 'no-cache'
            
            # Ensure proper content type
            if request.path.endswith('.mp4'):
                response['Content-Type'] = 'video/mp4'
            elif request.path.endswith('.webm'):
                response['Content-Type'] = 'video/webm'
            elif request.path.endswith('.ogg'):
                response['Content-Type'] = 'video/ogg'
            elif request.path.endswith('.mov'):
                response['Content-Type'] = 'video/quicktime'
                
        return response


class CustomCorsMiddleware(MiddlewareMixin):
    """
    Custom CORS middleware to ensure proper headers are set for Vercel frontend
    """
    
    def process_response(self, request, response):
        # Add CORS headers for all responses
        origin = request.META.get('HTTP_ORIGIN', '')
        
        # Explicitly allow these origins
        allowed_origins = [
            'https://postworqq.vercel.app',
            'https://postworq.onrender.com',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
        ]
        
        # Allow exact matches and any vercel subdomain
        if origin in allowed_origins or (origin and 'vercel.app' in origin):
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
            response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with, x-forwarded-for, x-forwarded-host, x-forwarded-proto'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Expose-Headers'] = 'content-type, x-csrftoken'
        else:
            # For development, allow localhost
            if origin and ('localhost' in origin or '127.0.0.1' in origin):
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
                response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with, x-forwarded-for, x-forwarded-host, x-forwarded-proto'
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Expose-Headers'] = 'content-type, x-csrftoken'
        
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response.status_code = 200
            if origin in allowed_origins or (origin and 'vercel.app' in origin) or (origin and ('localhost' in origin or '127.0.0.1' in origin)):
                response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
            response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with, x-forwarded-for, x-forwarded-host, x-forwarded-proto'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'
        
        return response
