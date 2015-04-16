from django import forms
from .validators import *


class RegisterForm(forms.Form):
    email = forms.EmailField(
        max_length=100,
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': u"Email",
            }
        ), validators=[validate_email])
    password1 = forms.CharField(
        max_length=20,
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control',
                'placeholder': "Password",
            }
        ), validators=[validate_password])
    password2 = forms.CharField(
        max_length=20,
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control',
                'placeholder': "Repeat password",
            }
        ))

    def clean(self):
        cleaned_data = super(RegisterForm, self).clean()
        if "password1" not in self.errors:
            if cleaned_data.get("password1") != cleaned_data.get("password2"):
                raise ValidationError("Passwords don't match")
        return cleaned_data
