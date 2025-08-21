from functools import wraps
from flask_jwt_extended import get_jwt
from flask import jsonify
from config.utils import get_time

def role_required(allowed_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role != allowed_role:
                return jsonify({
                    'notif': {
                        'type': "danger",
                        'msg': f"Failed to access route: Permission Denied<b data-time='{get_time()}'></b>",
                    }
                })
            return fn(*args, **kwargs)
        return wrapper
    return decorator