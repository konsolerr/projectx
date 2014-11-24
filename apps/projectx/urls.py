from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('apps.projectx.views',
    url(r'^get-vector-functions/$', 'get_vector_functions_view', name='vector-functions'),
    url(r'^exec-json/(?P<name>\w+)/$', 'exec_json_view', name='exec-json'),
)

