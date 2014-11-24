from django.http import HttpResponse
import json

class JsonResponse(HttpResponse):
    """
    HttpResponse descendant, which return response with ``application/json`` mimetype.
    """
    def __init__(self, data, mimetype='application/json charset=UTF-8', status_code=200):
        super(JsonResponse, self).__init__(content=json.dumps(data),
                                           content_type=mimetype)
        self.content_decoded = data
        self.status_code = status_code