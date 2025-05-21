from datetime import date
from .utils import months_between, relativedelta, calculate_age
from app.data.config import CONTRIBUTION_RATES


def calculate_total_contribution(member):
    today = date.today()
    start_count_date = max(member.join_date_to_organization, date(2025, 1, 1))

    months_to_pay = months_between(start_count_date, today.replace(day=1))

    total = 0
    for i in range(months_to_pay):
        payment_date = start_count_date + relativedelta(months=i)
        age = calculate_age(member.date_of_birth, payment_date)

        if age < 20:
            rate = CONTRIBUTION_RATES["under_20"]
        elif 20 <= age <= 30:
            rate = CONTRIBUTION_RATES["between_20_30"]
        else:
            rate = CONTRIBUTION_RATES["over_30"]

        total += rate

    return total
