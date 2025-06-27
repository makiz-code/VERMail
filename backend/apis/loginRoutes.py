from config.blibs import *

login_bp = Blueprint('login_bp', __name__)
db = get_db()

SECRET_KEY = 'Makiz-Code'

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
    
    payload = {
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return jsonify({
        'data': {
            'token': token,
            'role': account.get('role'),
        },
    })
