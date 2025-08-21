from flask import Blueprint, request, jsonify
from bson import ObjectId
from config.mongo import get_db
from config.utils import get_time
from models.mailboxModel import Mailbox
from config.access import role_required
from flask_jwt_extended import jwt_required

mailbox_bp = Blueprint('mailbox_bp', __name__)
db = get_db()

@mailbox_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('TechAdmin')
def addMailbox():
    try:
        mailbox_data = request.json
        email = mailbox_data['email']
        
        existing_mailbox = db.mailboxes.find_one({'email': email})
        if existing_mailbox:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add mailbox: Email <b data-time='{get_time()}'>{email}</b> already exists", 
                }
            })
        
        mailbox = Mailbox.from_dict(mailbox_data)
        result = db.mailboxes.insert_one(mailbox.to_dict())
        if result.inserted_id:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Mailbox <b data-time='{get_time()}'>{email}</b> Added Successfully", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to add mailbox: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}",
            },
            'error' : { 
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
    
@mailbox_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('TechAdmin')
def getMailboxes():
    mailboxes = []
    for mailbox in db.mailboxes.find():
        mailbox['_id'] = str(mailbox['_id'])
        mailboxes.append(mailbox)
    return jsonify({
        'data': mailboxes
    })

@mailbox_bp.route('/<id>', methods=['GET'])
@jwt_required()
@role_required('TechAdmin')
def getMailbox(id):
    mailbox = db.mailboxes.find_one({'_id': ObjectId(id)})
    if mailbox:
        mailbox_dict = Mailbox.from_dict(mailbox)
        return jsonify({
            'data': mailbox_dict.to_dict()
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to get mailbox: id <b data-time='{get_time()}'>{id}</b> not found",
            }
        })
    
@mailbox_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('TechAdmin')
def updateMailbox(id):
    try:
        mailbox_data = request.json
        old_email = db.mailboxes.find_one({'_id': ObjectId(id)}).get('email')
        new_email = mailbox_data['email']

        existing_mailbox = db.mailboxes.find_one({'email': new_email})
        if existing_mailbox and str(existing_mailbox['_id']) != id:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to update mailbox: Email <b data-time='{get_time()}'>{new_email}</b> already exists", 
                }
            })
        
        mailbox = Mailbox.from_dict(mailbox_data)
        result = db.mailboxes.update_one({'_id': ObjectId(id)}, {'$set': mailbox.to_dict()})
        if result.modified_count > 0:
            deleted_count = db.senders.delete_one({'mailbox': old_email, 'email': new_email}).deleted_count
            updated_count = db.senders.update_many({'mailbox': old_email}, {'$set': {'mailbox': new_email}}).modified_count
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Mailbox <b data-time='{get_time()}'>{new_email}</b> Updated Successfully"
                    + (f", {updated_count} Sender(s) updated" if updated_count > 0 else "")
                    + (f", {deleted_count} Sender(s) deleted" if deleted_count > 0 else ""),
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to update mailbox: id <b data-time='{get_time()}'>{id}</b> not found", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to update mailbox: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}",
            },
            'error' : {
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
        
@mailbox_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@role_required('TechAdmin')
def deleteMailbox(id):
    mailbox = db.mailboxes.find_one({'_id': ObjectId(id)})
    if mailbox:
        result = db.mailboxes.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            deleted_count = db.senders.delete_many({'mailbox': mailbox.get('email')}).deleted_count
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Mailbox <b data-time='{get_time()}'>{mailbox.get('email')}</b> Deleted Successfully"
                    + (f", {deleted_count} Sender(s) deleted" if deleted_count > 0 else ""),
                }
            })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to delete mailbox: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
