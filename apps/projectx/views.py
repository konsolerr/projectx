import json
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt

from Utils.responses import JsonResponse
from .utils import make_json_query

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
        results = make_json_query(fun[0], fun[1], **arguments)
        return JsonResponse(data=results)


exec_json_view = csrf_exempt(ExecJsonView.as_view())
