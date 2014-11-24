from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    (r'^', include('apps.main.urls', namespace='main')),
    url(r'^admin/', include(admin.site.urls)),
)
