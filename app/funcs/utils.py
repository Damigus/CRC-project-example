import json
import os
import unicodedata
import re

from datetime import datetime
from dateutil.relativedelta import relativedelta


def write_to_json_file(filename, data):
    directory = os.path.dirname(filename)
    if not os.path.exists(directory):
        os.makedirs(directory)

    if not os.path.exists(filename):
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump([], f)

    try:
        with open(filename, 'r', encoding='utf-8') as ban_file:
            existing_data = json.load(ban_file)
    except json.JSONDecodeError:
        existing_data = []

    existing_data.append(data)

    with open(filename, 'w', encoding='utf-8') as new_data:
        json.dump(existing_data, new_data, indent=4, ensure_ascii=False)


def get_data_from_json(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as ban_file:
            existing_data = json.load(ban_file)
    except json.JSONDecodeError:
        existing_data = []

    return existing_data


def extract(email, fragment):
    if fragment in email:
        return email.replace(fragment, "").rstrip("@")
    return email


def get_role_from_email(email):
    prefix = extract(email, 'nowageneracja.org')
    return prefix


def remove_accents(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c)).lower().replace(' ',
                                                                                                                   '')


def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)


def is_valid_phone(phone):
    return re.match(r"^\+?\d{9,15}$", phone)


def convert_date(date_str):
    date_obj = datetime.fromisoformat(date_str)
    return date_obj.strftime("%d %B %Y, %H:%M UTC")


def calculate_age(born, on_date):
    return on_date.year - born.year - ((on_date.month, on_date.day) < (born.month, born.day))


def months_between(start_date, end_date):
    delta = relativedelta(end_date, start_date)
    return delta.years * 12 + delta.months + (1 if delta.days >= 0 else 0)
