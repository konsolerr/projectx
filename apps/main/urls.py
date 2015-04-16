from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('apps.main.views',
    url(r'^$', 'main_page_view', name='main-page'),
    url(r'^about/$', 'about_page_view', name='about'),
)