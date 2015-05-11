from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('apps.projectx.views',
    url(r'^create/(?P<name>\w+)/$', 'dataset_creation_view', name='dataset-creation'),
    url(r'^data/(?P<method>\w+)/(?P<data>[^/]+)(/(?P<key>\w+))?/$', 'get_data_view', name='get-data'),
    url(r'^download/(?P<key>\w+)/(?P<file_name>[^/]+)/$', 'download_file_view', name='download_file'),
)

