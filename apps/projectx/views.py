import json
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt

from Utils.responses import JsonResponse
from .utils import *

allowed_r_functions = {
    'mean': ["base", "mean", "Mean", ['x']],
    'sum': ["base", "sum", "Sum", ['x']],
    'sd': ["stats", "sd", "Standard Deviation", ['x']],
    'length': ["base", "length", "Length", ['x']],
    'mad': ["stats", "mad", "Median Absolute Deviation", ['x', "center", "constant"]],
    'median': ["stats", "median", "Median", ['x']],
    'rnorm': ["stats", "rnorm", "Rnorm", ["n", "mean"]]
}
allowed_vector_function_names = ['mean', 'sum', 'sd', 'length', 'mad', 'median']
allowed_vector_functions = {name: allowed_r_functions[name] for name in allowed_vector_function_names}


class GetVectorFunctionsView(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse(allowed_vector_functions)


get_vector_functions_view = GetVectorFunctionsView.as_view()


class ExecJsonView(View):
    def post(self, request, *args, **kwargs):
        fun_name = kwargs['name']
        if fun_name not in allowed_r_functions:
            raise PermissionDenied
        fun = allowed_r_functions[fun_name]
        data = json.loads(request.POST["data"])
        arguments = {
            name: data[name]
            for name in fun[3]
            if name in data
        }
        results = make_query(fun[0], fun[1], **arguments).get_value()
        return JsonResponse(data=results)


exec_json_view = csrf_exempt(ExecJsonView.as_view())


allowed_operations_on_dataset = {
    'cut': ['testPackage', 'test_cut', 'CUT', ['start', 'end']],
    'length': ['testPackage', 'test_length', 'Length', []],
    'mad': ["testPackage", "test_mad", "Median Absolute Deviation", ["center", "constant"]],
    'sum': ['testPackage', 'test_sum', "Sum", []]
}
allowed_vector_function_names = ['length', 'sum', 'mad']
allowed_vector_functions = {name: allowed_operations_on_dataset[name]
                            for name in allowed_vector_function_names}


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


class GetNewDataset(View):
    def get(self, request, *ags, **kwargs):
        rnorm = make_query('stats', 'rnorm', n=20)
        dataset = make_query('testPackage', 'DataSet', dataset=rnorm.key)
        return ocpu_response(dataset)
get_new_dataset_view = GetNewDataset.as_view()


class DatasetOperationView(View):
    def get(self, request, *args, **kwargs):
        key = kwargs['key']
        name = kwargs['name']
        if name not in allowed_operations_on_dataset:
            raise PermissionDenied
        operation = allowed_operations_on_dataset[name]
        arguments = {
            name: request.GET[name]
            for name in operation[3]
            if name in request.GET
        }
        arguments['obj'] = key
        result = make_query(
            operation[0],
            operation[1],
            **arguments
        )
        return ocpu_response(result)
dataset_operation_view = DatasetOperationView.as_view()

class GetVectorFunctionsView(View):
    def get(self, request, *args, **kwargs):
        return JsonResponse(allowed_vector_functions)


get_vector_functions_view = GetVectorFunctionsView.as_view()