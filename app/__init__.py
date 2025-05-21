from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from app.scheduler import init_scheduler
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'super_secret_key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'

    db.init_app(app)
    init_scheduler(app)
    migrate = Migrate(app, db)

    from app.routes.views import views
    from app.routes.auth import auth
    from app.controllers.member_controller import crud
    from app.controllers.csv_controller import crud
    from app.controllers.circle_controller import crud

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(crud, url_prefix='/')

    from app.models.models import User, Member, Circle

    with app.app_context():
        db.create_all()

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        user_data = session.get('user')
        if user_data and user_data['id'] == user_id:
            return User(user_id=user_data['id'], email=user_data['email'], name=user_data.get('name'))
        return None

    return app
