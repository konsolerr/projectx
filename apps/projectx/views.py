import json
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt

from Utils.responses import JsonResponse, HttpResponse
from .utils import *


def ocpu_response(ocpu_object):
    data = {
        'key': ocpu_object.key,
        'html': ocpu_object.meta["html"][0],
        'keys': ocpu_object.keys,
        'code': ocpu_object.meta["log"][0],
        'name': ocpu_object.meta["name"][0],
        'className': ocpu_object.meta["class"][0],
        'file_names': ocpu_object.file_names()
    }
    return JsonResponse(data=data)


class DatasetCreationView(View):
    def post(self, request, *args, **kwargs):
        name = kwargs['name']
        arguments = {}
        files = {}
        for key in request.POST:
            arguments[key] = request.POST.get(key)

        for fl in request.FILES:
            files[fl] = request.FILES[fl]
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


class DownloadFileView(View):
    def get(self, request, *args, **kwargs):
        key = kwargs['key']
        file_name = kwargs['file_name']
        url = "http://%s/ocpu/tmp/%s/files/%s" % (settings.OPENCPU_DOMAIN, key, file_name)
        res = requests.get(url)
        response = HttpResponse(content_type="text/tsv")
        response["Content-Disposition"] = "attachment; filename=%s" % file_name
        response.write(res.text)
        return response
download_file_view = DownloadFileView.as_view()