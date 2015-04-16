from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('apps.accounts.views',
    url(r'^login/$', 'login_page', name='signin'),
    url(r'^register/$', 'registration_page', name='signup'),
)

