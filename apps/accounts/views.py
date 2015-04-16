from django.views.generic import TemplateView, FormView
from .forms import RegisterForm

class LoginPageView(TemplateView):
    template_name = "accounts/login.html"
login_page = LoginPageView.as_view()


class RegistrationPageView(FormView):
    template_name = "accounts/registration.html"
    form_class = RegisterForm
registration_page = RegistrationPageView.as_view()