from django.core.validators import ValidationError
from django.contrib.auth import get_user_model
import re

ALPHANUMERIC = "^[A-Za-z0-9]+$"
NUMERIC = "^[0-9]+$"

ERRORS = {
    "short_password": "Password is too short (minimum is 8 characters)",
    "bad_format_password": "Password should contain only latin characters and digits",
    "already_occupied": "Sorry, this email is already in use",
    "doesnt_exist": "This email doesn't exist on ProjectX"
}


def validate_password(value):
    """
    validates a given string to be a password
    password should have at least 8 symbols and contain only digits and latin characters
    :param value: given string
    """
    if len(value) < 8:
        raise ValidationError(ERRORS["short_password"])
    if re.match(ALPHANUMERIC, value) is None:
        raise ValidationError(ERRORS["bad_format_password"])


def validate_email(value):
    """
    validates given email to be unoccupied by other user
    :param value: given string
    """
    User = get_user_model()
    if len(User.objects.filter(username=value)) > 0:
        raise ValidationError(ERRORS["already_occupied"])