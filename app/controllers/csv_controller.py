import csv
import io

from app.controllers.member_controller import crud
from flask_login import login_required
from flask import session, Response, request, jsonify
from app.data.config import administratorzy_ogolni, administratorzy_regionalni
from app.funcs.utils import remove_accents, is_valid_phone, is_valid_email
from app.models.models import Member
from app import db
from datetime import datetime


@crud.route("/export_members", methods=["GET"])
@login_required
def export_users():
    user_role = session.get('user').get('role')
    is_krd = "krd" in user_role.split(".")
    is_kkrd = "kkrd" in user_role

    all_members = Member.query.all()

    if user_role in administratorzy_ogolni or is_kkrd:
        members = all_members
    elif user_role in administratorzy_regionalni:
        members = [m for m in all_members if remove_accents(m.region) == user_role]
    elif is_krd:
        members = [m for m in all_members if remove_accents(m.region) == user_role.split(".")[1]]
    else:
        members = [m for m in all_members if remove_accents(m.circle) == user_role]

    members = [m.to_dict() for m in members]

    output = io.StringIO(newline='')
    writer = csv.writer(output,quoting=csv.QUOTE_ALL)

    writer.writerow([
        'ID', 'First Name', 'Last Name', 'Date of Birth', 'Place of Birth',
        'Join Date to Organization', 'Join Date to Circle',
        'ID Document Number', 'Phone Number', 'Email',
        'Contribution', 'Circle', 'Region', 'Additional Fields'
    ])

    for member in members:
        writer.writerow([
            member['id'],
            member['first_name'],
            member['last_name'],
            member['date_of_birth'],
            member['place_of_birth'],
            member['join_date_to_organization'],
            member['join_date_to_circle'],
            member['id_document_number'],
            member['phone_number'],
            member['email'],
            member['contribution'],
            member['circle'],
            member['region'],
            member['additional_fields']
        ])

    output.seek(0)

    response = Response(
        output.getvalue().encode('utf-8'),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment;filename=members.csv"}
    )

    response.headers['Content-Type'] = 'text/csv; charset=utf-8-sig'

    return response


@crud.route('/import_members', methods=['POST'])
@login_required
def import_members():
    if 'file' not in request.files:
        return 'Brak pliku w żądaniu', 400

    file = request.files['file']

    if file.filename == '':
        return 'Nie wybrano pliku', 400

    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    reader = csv.DictReader(stream)

    errors = []
    added_count = 0

    for i, row in enumerate(reader, start=2):
        email = row['email']
        phone = row['phone_number']
        pesel = row['id_document_number']

        if not is_valid_email(email):
            errors.append(f"Wiersz {i}: Niepoprawny email ({email})")
            continue

        if not is_valid_phone(phone):
            errors.append(f"Wiersz {i}: Niepoprawny numer telefonu ({phone})")
            continue

        if Member.query.filter_by(id_document_number=pesel).first():
            errors.append(f"Wiersz {i}: Użytkownik z pesel {pesel} już istnieje")
            continue

        if Member.query.filter_by(phone_number=phone).first():
            errors.append(f"Wiersz {i}: Użytkownik z numerem telefonu {phone} już istnieje")
            continue

        if Member.query.filter_by(email=email).first():
            errors.append(f"Wiersz {i}: Użytkownik z adresem email {email} już istnieje")
            continue

        try:
            member = Member(
                first_name=row['first_name'],
                last_name=row['last_name'],
                date_of_birth=datetime.strptime(row['date_of_birth'], "%Y-%m-%d").date() if row[
                    'date_of_birth'] else None,
                place_of_birth=row['place_of_birth'].lower() if row['place_of_birth'] else None,
                join_date_to_organization=datetime.strptime(row['join_date_to_organization'], "%Y-%m-%d").date() if row[
                    'join_date_to_organization'] else None,
                join_date_to_circle=datetime.strptime(row['join_date_to_circle'], "%Y-%m-%d").date() if row[
                    'join_date_to_circle'] else None,
                id_document_number=pesel,
                phone_number=phone,
                email=email,
                contribution=row['contribution'] or None,
                circle=row['circle'].lower(),
                region=row['region'].lower(),
                additional_fields=row['additional_fields']
            )

            db.session.add(member)
            added_count += 1

        except Exception as e:
            errors.append(f"Wiersz {i}: Błąd podczas dodawania rekordu — {str(e)}")

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd przy zapisie do bazy: {str(e)}"}), 500

    return jsonify({
        "message": f"Import zakończony — dodano {added_count} użytkowników.",
        "errors": errors
    }), 200
