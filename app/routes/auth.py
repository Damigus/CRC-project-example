import os
import pathlib
import requests
from dotenv import load_dotenv

from app.funcs.decorators import login_is_required
from app.funcs.utils import get_role_from_email
from flask import session, abort, redirect, request, Blueprint, render_template
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pip._vendor import cachecontrol
import google.auth.transport.requests
from flask_login import login_user
from app.models.models import User

load_dotenv()

auth = Blueprint('auth', __name__)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = "1"

client_secrets_file = os.path.join(pathlib.Path(__file__).parent.parent, "../client_secret.json")
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

flow = Flow.from_client_secrets_file(
    client_secrets_file=client_secrets_file,
    scopes=["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email",
            "openid"],
    redirect_uri=os.getenv('GOOGLE_REDIRECT_URI'))


@auth.route('/login')
def login():
    authorization_url, state = flow.authorization_url()
    session['state'] = state
    return redirect(authorization_url)


@auth.route('/callback')
def auth_callback():
    flow.fetch_token(authorization_response=request.url)

    if session['state'] != request.args['state']:
        abort(500)

    credentials = flow.credentials
    request_session = requests.session()
    cached_session = cachecontrol.CacheControl(request_session)
    token_request = google.auth.transport.requests.Request(session=cached_session)

    id_info = id_token.verify_oauth2_token(
        id_token=credentials._id_token,
        request=token_request,
        audience=GOOGLE_CLIENT_ID,
        clock_skew_in_seconds=30
    )

    session["google_id"] = id_info.get("sub")
    session["name"] = id_info.get("name")
    session["user"] = {
        'id': id_info.get('sub'),
        'email': id_info.get('email'),
        'role': get_role_from_email(id_info.get('email'))
    }

    user = User(user_id=id_info.get('sub'), email=id_info.get('email'), name=id_info.get('name'))
    login_user(user)

    return redirect("/protected_area")


@auth.route('/logout')
def logout():
    session.clear()
    return redirect('/')


@auth.route('/')
def index():
    return render_template("login.html")


@auth.route('/protected_area')
@login_is_required
def protected_area():
    return redirect('/main')
