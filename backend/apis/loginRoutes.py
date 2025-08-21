import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from config.mongo import get_db
from config.utils import get_time
from flask_jwt_extended import create_access_token

login_bp = Blueprint('login_bp', __name__)
db = get_db()

@login_bp.route('/', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    account = db.accounts.find_one({'username': username})
    if not account or not check_password_hash(account.get('password'), password):
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to login<b data-time='{get_time()}'></b>: invalid credentials",
            },
        })

    if not account.get('state'):
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to login<b data-time='{get_time()}'></b>: account deactivated",
            },
        })

    access_token = create_access_token(
        identity=str(account.get('_id')),
        additional_claims={
            'role': account.get('role')
        },
        expires_delta=datetime.timedelta(days=1)
    )
    
    return jsonify({
        'data': {
            'token': access_token,
        },
    })
