from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from config.mongo import get_db
from config.utils import get_time
from models.fieldModel import Field
from config.access import role_required

field_bp = Blueprint('field_bp', __name__)
db = get_db()

@field_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('BusiAdmin')
def addField():
    try:
        field_data = request.json
        topic = field_data['topic']
        name = field_data['name']
        
        existing_field = db.fields.find_one({'topic': topic,'name': name})
        if existing_field:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add field: Field <b data-time='{get_time()}'>{name}</b> already associated with Topic <b data-time='{get_time()}'>{topic}</b>", 
                }
            })
        
        field = Field.from_dict(field_data)
        result = db.fields.insert_one(field.to_dict())
        if result.inserted_id:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Field <b data-time='{get_time()}'>{name}</b> Added Successfully", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to add field: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}", 
            },
            'error' : {
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
    
@field_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('BusiAdmin')
def getFields():
    fields = []
    for field in db.fields.find():
        field['_id'] = str(field['_id'])
        fields.append(field)
    return jsonify({
        'data': fields
    })

@field_bp.route('/<id>', methods=['GET'])
@jwt_required()
@role_required('BusiAdmin')
def getField(id):
    field = db.fields.find_one({'_id': ObjectId(id)})
    if field:
        field_dict = Field.from_dict(field)
        return jsonify({
            'data': field_dict.to_dict()
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to get field: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
    
@field_bp.route('/<id>/', methods=['PUT'])
@jwt_required()
@role_required('BusiAdmin')
def updateField(id):
    try:
        field_data = request.json
        field_data['name'] = field_data['name'].upper()
        
        topic = field_data['topic']
        new_name = field_data['name']
        
        existing_field = db.fields.find_one({'topic': topic,'name': new_name})
        if existing_field and str(existing_field['_id']) != id:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to update field: Field <b data-time='{get_time()}'>{new_name}</b> already associated with Topic <b data-time='{get_time()}'>{topic}</b>", 
                }
            })

        field = Field.from_dict(field_data)
        result = db.fields.update_one({'_id': ObjectId(id)}, {'$set': field.to_dict()})
        if result.modified_count > 0:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Field <b data-time='{get_time()}'>{new_name}</b> Updated Successfully", 
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to update field: id <b data-time='{get_time()}'>{id}</b> not found", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to update field: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}", 
            }, 
            'error' : {
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
        
@field_bp.route('/<id>/', methods=['DELETE'])
@jwt_required()
@role_required('BusiAdmin')
def deleteField(id):
    field = db.fields.find_one({'_id': ObjectId(id)})
    if field:
        result = db.fields.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Field <b data-time='{get_time()}'>{field.get('name')}</b> Deleted Successfully", 
                }
            })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to delete field: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
