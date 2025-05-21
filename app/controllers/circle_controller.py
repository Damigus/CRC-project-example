from app.controllers.member_controller import crud
from flask_login import login_required
from app.models.models import Circle
from flask import jsonify, request, session
from app import db
from app.data.config import administratorzy_ogolni, administratorzy_regionalni
from app.funcs.utils import remove_accents


@crud.route("/create_circle", methods=["POST"])
@login_required
def create_circle():
    data = request.get_json()

    if not data or "name" not in data or "region" not in data:
        return jsonify({"error": "Brak wymaganych danych: 'name' i 'region'"}), 400

    try:
        new_circle = Circle(
            name=data["name"],
            region=data["region"]
        )
        db.session.add(new_circle)
        db.session.commit()
        return jsonify({"message": "Koło utworzone", "id": new_circle.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas tworzenia: {str(e)}"}), 500


# DELETE
@crud.route("/delete_circle/<int:id>", methods=["DELETE"])
@login_required
def delete_circle(id):
    circle = Circle.query.get(id)
    if not circle:
        return jsonify({"error": "Koło nie znalezione"}), 404

    try:
        db.session.delete(circle)
        db.session.commit()
        return jsonify({"message": "Koło usunięte"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas usuwania: {str(e)}"}), 500


# UPDATE
@crud.route("/update_circle/<int:id>", methods=["PATCH"])
@login_required
def update_circle(id):
    circle = Circle.query.get(id)
    if not circle:
        return jsonify({"error": "Koło nie znalezione"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Brak danych do edycji"}), 400

    try:
        if "name" in data:
            circle.name = data["name"]
        if "region" in data:
            circle.region = data["region"]

        db.session.commit()
        return jsonify({"message": "Dane koła zaktualizowane"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Błąd podczas edycji: {str(e)}"}), 500


@crud.route("/get_circles", methods=["GET"])
@login_required
def get_circles():
    user_role = session.get('user').get('role')

    if user_role in administratorzy_ogolni:
        circles = Circle.query.all()

    elif user_role in administratorzy_regionalni:
        region_name = user_role

        circles = []
        all_circles = Circle.query.all()
        
        for circle in all_circles:
            normalized_region = remove_accents(circle.region)
            if normalized_region == region_name:
                circles.append(circle)

    else:
        circles = []
        all_circles = Circle.query.all()
        
        for circle in all_circles:
            normalized_circle_name = remove_accents(circle.name)
            if normalized_circle_name == user_role:
                circles.append(circle)

    result = [
        {
            "id": circle.id,
            "name": circle.name,
            "region": circle.region
        }
        for circle in circles
    ]
    
    return jsonify(result), 200