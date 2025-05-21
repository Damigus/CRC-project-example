import os
import json

from flask import Blueprint, request, jsonify, current_app

from flask_login import login_required
from datetime import datetime
from app.models.models import Member
from app import db
from app.funcs.utils import is_valid_email, is_valid_phone
from app.funcs.member_funcs import ban_member, delete_member, unban_member
from app.funcs.utils import get_data_from_json
from app.funcs.contribution_utils import calculate_total_contribution

crud = Blueprint("crud", __name__)


@crud.route("/register_user", methods=["POST"])
@login_required
def register_user():
    data = request.form.to_dict()
    declaration = request.files.get("deklaracja")

    if not data:
        return jsonify({"error": "Brak danych w żądaniu"}), 400

    email = data.get("email", "")
    phone = data.get("telefon", "")
    pesel = data.get("pesel", "")

    if not is_valid_email(email):
        return jsonify({"error": "Niepoprawny email"}), 400

    if not is_valid_phone(phone):
        return jsonify({"error": "Niepoprawny numer telefonu"}), 400

    if Member.query.filter_by(id_document_number=pesel).first():
        return jsonify({"error": "Użytkownik z tym numerem dokumentu istnieje"}), 400

    if Member.query.filter_by(phone_number=phone).first():
        return jsonify({"error": "Użytkownik z tym numerem telefonu istnieje"}), 400

    if Member.query.filter_by(email=email).first():
        return jsonify({"error": "Użytkownik z tym adresem email istnieje"}), 400

    if ' ' in pesel:
        return jsonify({"error": "Niepoprawny numer dokumentu"}), 400

    path = None
    if declaration:
        os.makedirs("uploads", exist_ok=True)
        extension = os.path.splitext(declaration.filename)[1]
        unique_filename = f"{pesel}{extension}"
        path = os.path.join("uploads", unique_filename)
        declaration.save(path)

    try:
        new_member = Member(
            first_name=data.get("imie"),
            last_name=data.get("nazwisko"),
            date_of_birth=datetime.strptime(data.get("data_urodzenia"), "%Y-%m-%d").date(),
            place_of_birth=data.get("miejsce_urodzenia"),
            join_date_to_organization=datetime.strptime(data.get("data_dolaczenia"), "%Y-%m-%d").date(),
            join_date_to_circle=datetime.strptime(data.get("data_dolaczenia_kolo"), "%Y-%m-%d").date(),
            id_document_number=data.get("pesel"),
            phone_number=data.get("telefon"),
            email=data.get("email"),
            circle=data.get("kolo"),
            region=data.get("region"),
            membership_form_scan=path,
            additional_fields=data.get("dodatkowe_pole"),
        )

        new_member.contribution = calculate_total_contribution(new_member)

        db.session.add(new_member)
        db.session.commit()

        return jsonify({"message": "Zarejestrowano użytkownika"}), 201

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": f"Błąd serwera: {str(e)}"}), 500


@crud.route("/delete_user/<int:id>", methods=["DELETE"])
@login_required
def delete_user(id):
    data = request.get_json()
    member = Member.query.get(id)

    if not member:
        return jsonify({"error": "Użytkownik nie istnieje"}), 404

    reason = None
    if data:
        reason = data.get("reason")
        member.reason = reason

    try:
        member_data = member.to_dict()
        if reason:
            member_data['reason'] = reason

        delete_member(member_data)

        db.session.delete(member)
        db.session.commit()

        return jsonify({"message": "Użytkownik usunięty i zarchiwizowany"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas usuwania: {str(e)}"}), 500


@crud.route("/user_info/<int:id>", methods=["GET"])
@login_required
def user_info(id):
    member = Member.query.get(id)
    if member:
        return jsonify({"user_info": member.to_dict()}), 200
    return jsonify({"error": "Użytkownik nie znaleziony"}), 404


@crud.route("/ban_user/<int:id>", methods=["POST"])
@login_required
def ban_user(id):
    data = request.get_json()
    member = Member.query.get(id)

    if not member:
        return jsonify({"error": "Użytkownik nie znaleziony"}), 404

    reason = None
    if data:
        reason = data.get("reason")
        if hasattr(member, 'reason'):
            member.reason = reason

    try:
        member_data = member.to_dict()
        if reason:
            member_data['reason'] = reason

        ban_member(member_data)
        db.session.delete(member)
        db.session.commit()

        return jsonify({"message": "Użytkownik zbanowany"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas banowania: {str(e)}"}), 500


@crud.route("/edit_user/<int:id>", methods=["PATCH"])
@login_required
def edit_user(id):
    member = Member.query.get(id)
    if not member:
        return jsonify({"error": "Użytkownik nie znaleziony"}), 404

    data = request.get_json()
    declaration = request.files.get("deklaracja")

    if not data and not declaration:
        return jsonify({"error": "Brak danych do edycji"}), 400

    updatable_fields = {
        "imie": "first_name",
        "nazwisko": "last_name",
        "data_urodzenia": "date_of_birth",
        "miejsce_urodzenia": "place_of_birth",
        "data_przystapienia_do_organizacji": "join_date_to_organization",
        "data_przystapienia_do_kola": "join_date_to_circle",
        "pesel": "id_document_number",
        "telefon": "phone_number",
        "email": "email",
        "skladka": "contribution",
        "kolo": "circle",
        "region": "region",
        "dodatkowe_pola": "additional_fields"
    }

    try:
        old_pesel = member.id_document_number

        for field, model_field in updatable_fields.items():
            if field in data:
                value = data[field]
                if field in ["data_urodzenia", "data_przystapienia_do_organizacji", "data_przystapienia_do_kola"]:
                    if value:
                        setattr(member, model_field, datetime.strptime(value, "%Y-%m-%d").date())
                elif field == "email":
                    if not is_valid_email(value):
                        return jsonify({"error": "Niepoprawny email"}), 400
                    setattr(member, model_field, value)
                elif field == "telefon":
                    if not is_valid_phone(value):
                        return jsonify({"error": "Niepoprawny numer telefonu"}), 400
                    setattr(member, model_field, value)
                else:
                    setattr(member, model_field, value)

        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        if member.membership_form_scan and old_pesel != member.id_document_number:
            old_path = member.membership_form_scan
            old_ext = os.path.splitext(old_path)[1]
            new_path = os.path.join(upload_dir, f"{member.id_document_number}{old_ext}")

            if os.path.exists(old_path):
                os.rename(old_path, new_path)
                member.membership_form_scan = new_path

        if declaration:
            if member.membership_form_scan and os.path.exists(member.membership_form_scan):
                os.remove(member.membership_form_scan)

            ext = os.path.splitext(declaration.filename)[1]
            new_path = os.path.join(upload_dir, f"{member.id_document_number}{ext}")
            declaration.save(new_path)
            member.membership_form_scan = new_path

        db.session.commit()
        return jsonify({"message": "Dane użytkownika zaktualizowane"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas edycji: {str(e)}"}), 500


@crud.route("/unban_user/<int:id>", methods=["POST"])
@login_required
def unban_user(id):
    member_data = unban_member(id)
    if not member_data:
        return jsonify({"error": "Użytkownik nie znaleziony"}), 404

    try:
        new_member = Member(
            id=member_data["id"],
            first_name=member_data["first_name"],
            last_name=member_data["last_name"],
            place_of_birth=member_data["place_of_birth"],
            date_of_birth=datetime.strptime(member_data["date_of_birth"], "%Y-%m-%d").date(),
            join_date_to_organization=datetime.strptime(member_data["join_date_to_organization"], "%Y-%m-%d").date(),
            join_date_to_circle=datetime.strptime(member_data["join_date_to_circle"], "%Y-%m-%d").date(),
            id_document_number=member_data["id_document_number"],
            phone_number=member_data["phone_number"],
            email=member_data["email"],
            contribution=member_data["contribution"],
            circle=member_data["circle"],
            region=member_data["region"],
            membership_form_scan=member_data["membership_form_scan"],
            additional_fields=member_data["additional_fields"],
        )

        db.session.add(new_member)
        db.session.commit()
        response_data = {"message": "Użytkownik odbanowany"}
        response_data.update(new_member.to_dict())
        return jsonify(response_data), 200

    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"error": f"Błąd podczas odbanowywania: {str(e)}"}), 500


@crud.route('/get_members', methods=['GET'])
@login_required
def get_members():
    members = Member.query.all()
    return jsonify([{
        'id': member.id,
        'first_name': member.first_name,
        'last_name': member.last_name,
        'date_of_birth': member.date_of_birth.strftime('%Y-%m-%d') if member.date_of_birth else None,
        'place_of_birth': member.place_of_birth,
        'join_date_to_organization': member.join_date_to_organization.strftime(
            '%Y-%m-%d') if member.join_date_to_organization else None,
        'join_date_to_circle': member.join_date_to_circle.strftime('%Y-%m-%d') if member.join_date_to_circle else None,
        'id_document_number': member.id_document_number,
        'phone_number': member.phone_number,
        'email': member.email,
        'contribution': member.contribution,
        'circle': member.circle,
        'region': member.region,
        'membership_form_scan': member.membership_form_scan,
        'additional_fields': member.additional_fields
    } for member in members])


@crud.route("/permanently_delete_from_archive/<int:id>", methods=["DELETE"])
@login_required
def permanently_delete_from_archive(id):
    filename = 'app/archive/deleted_users.json'

    try:
        deleted_users = get_data_from_json(filename)

        updated_deleted_users = [user for user in deleted_users if user.get('id') != id]

        if len(updated_deleted_users) == len(deleted_users):
            return jsonify({"error": "Użytkownik nie znaleziony w archiwum"}), 404

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(updated_deleted_users, f, indent=4, ensure_ascii=False)

        return jsonify({"message": "Użytkownik całkowicie usunięty z archiwum"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": f"Błąd podczas usuwania użytkownika z archiwum: {str(e)}"}), 500


@crud.route("/update_declaration/<int:user_id>", methods=["POST"])
@login_required
def update_declaration(user_id):
    member = Member.query.get(user_id)
    if not member:
        return jsonify({"error": "Użytkownik nie istnieje"}), 404

    if 'declaration_file' not in request.files:
        return jsonify({"error": "Brak pliku w żądaniu"}), 400

    file = request.files['declaration_file']

    if file.filename == '':
        return jsonify({"error": "Nie wybrano pliku"}), 400

    allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png'}
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

    if file_ext not in allowed_extensions:
        return jsonify({"error": "Niedozwolony format pliku. Dozwolone formaty: PDF, JPG, JPEG, PNG"}), 400

    try:
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')

        os.makedirs(upload_folder, exist_ok=True)

        pesel = member.id_document_number
        new_filename = f"{pesel}.{file_ext}"
        filepath = os.path.join(upload_folder, new_filename)

        old_file = member.membership_form_scan
        if old_file and os.path.exists(old_file):
            try:
                os.remove(old_file)
            except Exception as e:
                current_app.logger.error(f"Błąd podczas usuwania starego pliku dla pesel={pesel}: {str(e)}")

        file.save(filepath)

        member.membership_form_scan = filepath
        db.session.commit()

        return jsonify({
            "message": "Deklaracja zaktualizowana pomyślnie",
            "filename": new_filename
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Błąd podczas aktualizacji deklaracji dla pesel={pesel}: {str(e)}")
        return jsonify({"error": f"Wystąpił błąd: {str(e)}"}), 500
