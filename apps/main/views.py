__author__ = 'askmebefore'
from django.views.generic import TemplateView


class MainPageView(TemplateView):
    template_name = 'main.html'
main_page_view = MainPageView.as_view()


class AboutPageView(TemplateView):
    template_name = "about.html"
about_page_view = AboutPageView.as_view()
