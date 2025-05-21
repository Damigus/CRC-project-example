from flask import Blueprint, session, render_template, send_from_directory
from flask_login import login_required
from app.data.config import administratorzy_ogolni, administratorzy_regionalni, krajowy_rewident, regionalni_rewidenci
from app.models.models import Member
from app.funcs.utils import remove_accents, get_data_from_json, convert_date
import os

views = Blueprint('views', __name__)


@views.route('/menu')
@login_required
def menu():
    return render_template('menu.html')


@views.route('/main')
@login_required
def home():
    user_role = session.get('user').get('role')
    return render_template('main.html', user_role=user_role, admin=administratorzy_ogolni,
                           adm_reg=administratorzy_regionalni, kr_rew=krajowy_rewident, reg_rew=regionalni_rewidenci)


@views.route('/users')
@login_required
def users_page():
    user_role = session.get('user').get('role')
    is_kkrd = user_role == "kkrd"
    is_krd = user_role.startswith("krd.")

    query = Member.query

    if user_role in administratorzy_ogolni or is_kkrd:
        members = query.all()
    elif is_krd:
        region_name = user_role.split(".")[1]
        members = [m for m in query.all() if remove_accents(m.region) == region_name]
    elif user_role in administratorzy_regionalni:
        members = [m for m in query.all() if remove_accents(m.region) == user_role]
    else:
        members = [m for m in query.all() if remove_accents(m.circle) == user_role]

    members = [m.to_dict() for m in members]

    return render_template(
        'users.html',
        user_role=user_role,
        members=members,
        rewident=is_krd,
        admin=administratorzy_ogolni,
        adm_reg=administratorzy_regionalni,
        kr_rew=krajowy_rewident,
        reg_rew=regionalni_rewidenci
    )


@views.route('/register')
@login_required
def form():
    user_role = session.get('user').get('role')
    return render_template('register.html', user_role=user_role, admin=administratorzy_ogolni,
                           adm_reg=administratorzy_regionalni, kr_rew=krajowy_rewident, reg_rew=regionalni_rewidenci)


@views.route('/admin_panel')
@login_required
def admin_panel():
    user_role = session.get('user').get('role')
    if user_role not in administratorzy_ogolni:
        return "Brak dostepu", 404

    deleted_members = get_data_from_json('app/archive/deleted_users.json')

    for deleted in deleted_members:
        deleted['deleted_at'] = convert_date(deleted['deleted_at'])

    banned_members = get_data_from_json('app/archive/banned_users.json')

    for banned in banned_members:
        banned['banned_at'] = convert_date(banned['banned_at'])

    return render_template('admin_panel.html', deleted_members=deleted_members, banned_members=banned_members,
                           user_role=user_role, admin=administratorzy_ogolni,
                           adm_reg=administratorzy_regionalni)


@views.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    user_role = session.get('user').get('role')

    if "krd" in user_role:
        user_role = user_role.split(".")[1]

    upload_folder = os.path.join(os.getcwd(), 'uploads')
    file_path = os.path.join(upload_folder, filename)
    from_json = False

    try:
        member = Member.query.filter_by(id_document_number=filename.split(".")[0]).first()

        if member is None:
            doc_id = filename.split(".")[0]
            deleted = get_data_from_json('app/archive/deleted_users.json')
            banned = get_data_from_json('app/archive/banned_users.json')
            archived = deleted + banned
            member = next((m for m in archived if m.get('id_document_number') == doc_id), None)
            from_json = True


    except ValueError:
        return "Nieprawidłowa nazwa pliku", 400

    if not member:
        return "Brak członka powiązanego z tym plikiem", 404

    if from_json:
        region = member.get('region', '')
        circle = member.get('circle', '')
    else:
        region = member.region
        circle = member.circle
    allowed = False
    if user_role == remove_accents(region) or user_role == remove_accents(
            circle) or user_role in administratorzy_ogolni:
        allowed = True

    if os.path.exists(file_path) and allowed:
        return send_from_directory(upload_folder, filename)
    elif not allowed:
        return "Brak dostępu", 403
    elif not os.path.exists(file_path):
        return "Plik nie istnieje", 404

    return "Nieoczekiwany błąd", 500
