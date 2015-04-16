import json
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt

from Utils.responses import JsonResponse
from .utils import *


def ocpu_response(ocpu_object):
    html = None
    code = None
    try:
        html = ocpu_object.show_knit().get_value()
        code = ocpu_object.show_log().get_value()
    except:
        pass
    data = {
        'key': ocpu_object.key,
        'html': html,
        'keys': ocpu_object.show_knit().keys,
        'code': code
    }
    return JsonResponse(data=data)


class DatasetOperationView(View):
    def get(self, request, *args, **kwargs):
        key = kwargs['key']
        name = kwargs['name']
        arguments = json.loads(request.GET("args"))
        arguments['obj'] = key
        result = make_query(
            'GeneExprDataSet',
            name,
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
            files[fl] = request.FILES[fl]
        print(arguments, files)
        url = 'http://%s/ocpu/library/%s/R/%s' % (settings.OPENCPU_DOMAIN, 'GeneExprDataSet', name)
        ocpu_object = make_ocpu_query(url, arguments, files)
        return ocpu_response(ocpu_object)
dataset_creation_view = csrf_exempt(DatasetCreationView.as_view())


class GetDataView(View):
    def get(self, request, *args, **kwargs):
        data = kwargs['data']
        method = kwargs['method']
        options = {}
        if 'key' in kwargs and kwargs['key'] is not None:
            options['dataset'] = kwargs['key']
        response = make_data_query_post('GeneExprDataSet', data, **options)\
            if method == "post" else make_data_query_get('GeneExprDataSet', data)
        return JsonResponse(response)
get_data_view = GetDataView.as_view()