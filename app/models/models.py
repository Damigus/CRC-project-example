from flask_login import UserMixin
from app import db


class Circle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    region = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f'<Circle {self.name} ({self.region})>'


class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)

    date_of_birth = db.Column(db.Date, nullable=False)
    place_of_birth = db.Column(db.String(100), nullable=True)

    join_date_to_organization = db.Column(db.Date, nullable=False, default=0)
    join_date_to_circle = db.Column(db.Date, nullable=False, default=0)

    id_document_number = db.Column(db.String(50), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    contribution = db.Column(db.Integer, nullable=True, default=0)

    circle = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)

    membership_form_scan = db.Column(db.String(200), nullable=True)
    additional_fields = db.Column(db.String(), nullable=True)

    def __repr__(self):
        return f'<Member {self.first_name} {self.last_name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'place_of_birth': self.place_of_birth,
            'join_date_to_organization': self.join_date_to_organization.strftime(
                '%Y-%m-%d') if self.join_date_to_organization else None,
            'join_date_to_circle': self.join_date_to_circle.strftime('%Y-%m-%d') if self.join_date_to_circle else None,
            'id_document_number': self.id_document_number,
            'phone_number': self.phone_number,
            'email': self.email,
            'contribution': self.contribution,
            'circle': self.circle,
            'region': self.region,
            'membership_form_scan': self.membership_form_scan,
            'additional_fields': self.additional_fields
        }


class User(UserMixin):
    def __init__(self, user_id, email, name):
        self.id = user_id
        self.email = email
        self.name = name
