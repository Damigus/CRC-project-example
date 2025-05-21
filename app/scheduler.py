from datetime import date

from flask_apscheduler import APScheduler
from app.funcs.contribution_utils import calculate_total_contribution

scheduler = APScheduler()


def update_contributions():
    from app import create_app
    from app.models.models import Member
    from app import db

    app = create_app()

    with app.app_context():
        members = Member.query.all()
        for member in members:
            member.contribution = calculate_total_contribution(member)
        db.session.commit()
        print(f"[{date.today()}] Składki zostały zaktualizowane.")


def init_scheduler(app):
    if not scheduler.running:
        scheduler.init_app(app)
        scheduler.start()

    existing_job = scheduler.get_job('update_contributions_job')
    if existing_job:
        scheduler.remove_job('update_contributions_job')

    scheduler.add_job(
        id='update_contributions_job',
        func=update_contributions,
        trigger='cron',
        day=1,
        hour=0,
        minute=0
    )
