import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from bson import ObjectId
from config.mongo import get_db
from config.utils import get_time
from config.access import role_required
from libs.VERImap import init_pipes, get_emails
from libs.MailKit import set_file_with_payload

dashboard_bp = Blueprint('dashboard_bp', __name__)
db = get_db()

model_path = "backend/data/models/VERModel.pth"
labels_path = "backend/data/models/labels.json"
recs_path = "backend/data/records"

@dashboard_bp.route("/", methods=["POST"])
@jwt_required()
@role_required('SysUser')
def parseEmails():
    try:
        params = {
            'email_list': [],
            'passkey_list': [],
            'repository_list': [],
            'sender_emails_list': [],
            'topic_fields': {},
        }

        for mailbox in db.mailboxes.find({'state': True}):
            params['email_list'].append(mailbox['email'])
            params['passkey_list'].append(mailbox['passkey'])
            params['repository_list'].append(mailbox['repository'])

            sender_emails = [sender['email'] for sender in db.senders.find({'mailbox': mailbox['email']})]
            params['sender_emails_list'].append(sender_emails)

        for topic in db.topics.find():
            topic_name = topic['name']
            params['topic_fields'][topic_name] = {}

            for field in db.fields.find({'topic': topic_name}):
                field_name = field['name']
                query = field['query']
                params['topic_fields'][topic_name][field_name] = query

        tokenizer, model, qa, labels = init_pipes(model_path, labels_path)
        if None in (tokenizer, model, qa, labels):
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"No model available to load yet<b data-time='{get_time()}'></b>",
                }
            })
        
        final_data = get_emails(tokenizer, model, qa, labels, params)
        for data in final_data:
            data['validate'] = False

        if final_data:
            result = db.emails.insert_many(final_data)
            if result.inserted_ids:
                return jsonify({
                'notif': {
                    'type': "primary",
                    'msg': f"New emails added to database<b data-time='{get_time()}'></b>",
                }
            })
            else:
                return jsonify({
                    'notif': {
                        'type': "danger",
                        'msg': f"Failed to add new emails to database<b data-time='{get_time()}'></b>",
                    },
                })
        else: 
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"No existing new emails<b data-time='{get_time()}'></b>",
                }
            })

    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to parse Emails: <b data-time='{get_time()}'></b>{str(e)}",
            }
        })
    
@dashboard_bp.route("/", methods=["GET"])   
@jwt_required()
@role_required('SysUser') 
def getEmails():
    emails = list(db.emails.find())
    if emails:
        for email in emails:
            if len(email.get('to', [])) > 0:
                recipient_email = email['to'][0]
                repository_info = db.mailboxes.find_one({'email': recipient_email}, {'repository': 1})
                if repository_info:
                    email['repository'] = repository_info['repository']
                else:
                    email['repository'] = ''
            else:
                email['repository'] = ''

            email['_id'] = str(email['_id'])

        return jsonify({
            'data': emails,
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to get Emails: <b data-time='{get_time()}'></b>No emails were found",
            }
        })
    

@dashboard_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('SysUser')
def validateEmail(id):
    try:
        validate = db.emails.find_one({'_id': ObjectId(id)}).get('validate')
        result = db.emails.update_one({'_id': ObjectId(id)}, {'$set': {'validate': not validate}})
        if result.modified_count > 0:
            comment = "set to validated" if not validate else "marked as not validated"
            return jsonify({
                'notif': {
                    'type': "primary",
                    'msg': f"Email <b data-time='{get_time()}'></b> {comment}"
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to validate email: id <b data-time='{get_time()}'>{id}</b> not found", 
                }
            })
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to validate email: <b data-time='{get_time()}'></b>{str(e)}"
            }
        })
    
@dashboard_bp.route('/download/', methods=['POST'])
@jwt_required()
@role_required('SysUser')
def downloadFile():
    try:
        params = request.json
        filename = params.get('filename')
        payload = params.get('payload')

        os.makedirs(recs_path, exist_ok=True)
        filepath = os.path.abspath(os.path.join(recs_path, filename))

        set_file_with_payload(filepath, payload)
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to download file <b data-time='{get_time()}'>{filename}</b>: {str(e)}"
            }
        })
