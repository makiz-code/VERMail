from config.blibs import *

account_bp = Blueprint('account_bp', __name__)
db = get_db()

@account_bp.route('/', methods=['POST'])
def addAccount():
    try:
        account_data = request.json
        existing_account = db.accounts.find_one({'username': account_data['username']})
        if existing_account and check_password_hash(existing_account.get('password'), account_data['password']):
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add account: Username <b data-time='{get_time()}'>{account_data['username']}</b> already exists", 
                }
            })
        
        account = Account.from_dict(account_data)
        account = account.to_dict()

        account['password'] = generate_password_hash(account['password'])
        result = db.accounts.insert_one(account)
        if result.inserted_id:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Account <b data-time='{get_time()}'>{account_data['username']}</b> Added Successfully", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to add account: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}",
            },
            'error' : { 
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
    
@account_bp.route('/', methods=['GET'])
def getAccounts():
    accounts = []
    for account in db.accounts.find({'role': {'$ne': '0'}}):
        account['_id'] = str(account['_id'])
        accounts.append(account)
    return jsonify({
        'data': accounts
    })

@account_bp.route('/<id>', methods=['GET'])
def getAccount(id):
    account = db.accounts.find_one({'_id': ObjectId(id)})
    if account:
        account_dict = Account.from_dict(account)
        return jsonify({
            'data': account_dict.to_dict()
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to get account: id <b data-time='{get_time()}'>{id}</b> not found",
            }
        })
    
@account_bp.route('/<id>', methods=['PUT'])
def updateAccount(id):
    try:
        account_data = request.json
        existing_account = db.accounts.find_one({'username': account_data['username']})
        if existing_account and check_password_hash(existing_account.get('password'), account_data['password']) and str(existing_account['_id']) != id:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to update account: Username <b data-time='{get_time()}'>{account_data['username']}</b> already exists", 
                }
            })
        
        account = Account.from_dict(account_data)
        account = account.to_dict()

        if len(account['password']) != 64 and 'scrypt' not in account['password']:
            account['password'] = generate_password_hash(account['password'])

        result = db.accounts.update_one({'_id': ObjectId(id)}, {'$set': account})
        if result.modified_count > 0:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Account <b data-time='{get_time()}'>{account_data['username']}</b> Updated Successfully",
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to update account: id <b data-time='{get_time()}'>{id}</b> not found", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to update account: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}",
            },
            'error' : {
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
        
@account_bp.route('/<id>', methods=['DELETE'])
def deleteAccount(id):
    account = db.accounts.find_one({'_id': ObjectId(id)})
    if account:
        result = db.accounts.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Account <b data-time='{get_time()}'>{account.get('username')}</b> Deleted Successfully",
                }
            })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to delete account: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
         })
    