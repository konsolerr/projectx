import json
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt

from Utils.responses import JsonResponse
from .utils import *

def ocpu_response(ocpu_object):
    html = None
    try:
        html = ocpu_object.show_knit().get_value()
    except:
        pass
    data = {
        'key': ocpu_object.key,
        'html': html,
        'keys': ocpu_object.show_knit().keys
    }
    return JsonResponse(data=data)

class DatasetOperationView(View):
    def get(self, request, *args, **kwargs):
        key = kwargs['key']
        name = kwargs['name']
        arguments = json.loads(request.GET("args"))
        arguments['obj'] = key
        result = make_query(
            operation[0],
            operation[1],
            **arguments
        )
        return ocpu_response(result)
dataset_operation_view = DatasetOperationView.as_view()


class DatasetCreationView(View):
    def post(self, request, *args, **kwargs):
        name = kwargs['name']
        arguments = {}
        files = {}
        for key in request.POST:
            arguments[key] = request.POST.get(key)

        for fl in request.FILES:
            files[fl] = request.FILES['file']
        print(arguments, files)
        url = url = 'http://%s/ocpu/library/%s/R/%s' % (settings.OPENCPU_DOMAIN, 'GeneExprDataSet', name)
        ocpu_object = make_ocpu_query(url, arguments, files)
        return ocpu_response(ocpu_object)
dataset_creation_view = csrf_exempt(DatasetCreationView.as_view())


class GetDataView(View):
    def get(self, request, *args, **kwargs):
        data = kwargs['data']
        return JsonResponse(make_data_query('GeneExprDataSet', data))
get_datasets_view = GetDataView.as_view()
