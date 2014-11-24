__author__ = 'askmebefore'
from django.views.generic import TemplateView

class MainPageView(TemplateView):
    template_name = 'main.html'
main_page_view = MainPageView.as_view()