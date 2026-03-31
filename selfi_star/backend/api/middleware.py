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
