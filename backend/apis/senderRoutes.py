from config.blibs import *

sender_bp = Blueprint('sender_bp', __name__)
db = get_db()

@sender_bp.route('/', methods=['POST'])
def addSender():
    try:
        sender_data = request.json
        mailbox = sender_data['mailbox']
        email = sender_data['email']
        
        existing_sender = db.senders.find_one({'mailbox': mailbox,'email': email})
        if existing_sender:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add sender: Sender <b data-time='{get_time()}'>{email}</b> already associated with Mailbox <b data-time='{get_time()}'>{mailbox}</b>", 
                }
            })
        
        if mailbox == email:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add sender: <b data-time='{get_time()}'></b>Mailbox and Sender must be different", 
                }  
            })
        
        sender = Sender.from_dict(sender_data)
        result = db.senders.insert_one(sender.to_dict())
        if result.inserted_id:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Sender <b data-time='{get_time()}'>{email}</b> Added Successfully", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to add sender: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}", 
            }, 
            'error' : { 
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
    
@sender_bp.route('/', methods=['GET'])
def getSenders():
    senders = []
    for sender in db.senders.find():
        sender['_id'] = str(sender['_id'])
        senders.append(sender)
    return jsonify({
        'data': senders
    })

@sender_bp.route('/<id>', methods=['GET'])
def getSender(id):
    sender = db.senders.find_one({'_id': ObjectId(id)})
    if sender:
        sender_dict = Sender.from_dict(sender)
        return jsonify({
            'data': sender_dict.to_dict()
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to get sender: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
    
@sender_bp.route('/<id>', methods=['PUT'])
def updateSender(id):
    try:
        sender_data = request.json
        mailbox = sender_data['mailbox']
        new_email = sender_data['email']
        
        existing_sender = db.senders.find_one({'mailbox': mailbox,'email': new_email})
        if existing_sender and str(existing_sender['_id']) != id:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to update sender: Sender <b data-time='{get_time()}'>{new_email}</b> already associated with Mailbox <b data-time='{get_time()}'>{mailbox}</b>", 
                }
            })
        
        if mailbox == new_email:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add sender: <b data-time='{get_time()}'></b>Mailbox and Sender must be different", 
                }
            })

        sender = Sender.from_dict(sender_data)
        result = db.senders.update_one({'_id': ObjectId(id)}, {'$set': sender.to_dict()})
        if result.modified_count > 0:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Sender <b data-time='{get_time()}'>{new_email}</b> Updated Successfully", 
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to update sender: id <b data-time='{get_time()}'>{id}</b> not found", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to update sender: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}", 
            },
            'error' : { 
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
        
@sender_bp.route('/<id>', methods=['DELETE'])
def deleteSender(id):
    sender = db.senders.find_one({'_id': ObjectId(id)})
    if sender:
        result = db.senders.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Sender <b data-time='{get_time()}'>{sender.get('email')}</b> Deleted Successfully", 
                }
            })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to delete sender: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
