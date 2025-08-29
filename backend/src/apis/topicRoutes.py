from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from config.mongo import get_db
from config.utils import get_time
from models.topicModel import Topic
from config.access import role_required

topic_bp = Blueprint('topic_bp', __name__)
db = get_db()

@topic_bp.route('/', methods=['POST'])
@jwt_required()
@role_required('BusiAdmin')
def addTopic():
    try:
        topic_data = request.json
        name = topic_data['name']
        
        existing_topic = db.topics.find_one({'name': name})
        if existing_topic:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to add topic: Name <b data-time='{get_time()}'>{name}</b> already exists", 
                }
            })
        
        topic = Topic.from_dict(topic_data)
        result = db.topics.insert_one(topic.to_dict())
        if result.inserted_id:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Topic <b data-time='{get_time()}'>{name}</b> Added Successfully", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Failed to add topic: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}", 
            },
            'error' : { 
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
    
@topic_bp.route('/', methods=['GET'])
@jwt_required()
@role_required('BusiAdmin')
def getTopics():
    topics = []
    for topic in db.topics.find():
        topic['_id'] = str(topic['_id'])
        topics.append(topic)
    return jsonify({
        'data': topics
    })

@topic_bp.route('/<id>/', methods=['GET'])
@jwt_required()
@role_required('BusiAdmin')
def getTopic(id):
    topic = db.topics.find_one({'_id': ObjectId(id)})
    if topic:
        topic_dict = Topic.from_dict(topic)
        return jsonify({
            'data': topic_dict.to_dict()
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to get topic: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
    
@topic_bp.route('/<id>/', methods=['PUT'])
@jwt_required()
@role_required('BusiAdmin')
def updateTopic(id):
    try:
        topic_data = request.json
        topic_data['name'] = topic_data['name'].title()
        
        old_name = db.topics.find_one({'_id': ObjectId(id)}).get('name')
        new_name = topic_data['name']

        existing_topic = db.topics.find_one({'name': new_name})
        if existing_topic and str(existing_topic['_id']) != id:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to update topic: Name <b data-time='{get_time()}'>{new_name}</b> already exists", 
                }
            })
        
        topic = Topic.from_dict(topic_data)
        result = db.topics.update_one({'_id': ObjectId(id)}, {'$set': topic.to_dict()})
        if result.modified_count > 0:
            updated_count = db.fields.update_many({'topic': old_name}, {'$set': {'topic': new_name}}).modified_count
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Topic <b data-time='{get_time()}'>{new_name}</b> Updated Successfully"
                    + (f", {updated_count} Field(s) updated" if updated_count > 0 else ""),
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to update topic: id <b data-time='{get_time()}'>{id}</b> not found", 
                }
            })
        
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to update topic: <b data-time='{get_time()}'></b>{str(e).split(': ')[1]}", 
            },
            'error' : {
                'field': str(e).split(": ")[0], 
                'msg': str(e).split(": ")[1],
            }
        })
        
@topic_bp.route('/<id>/', methods=['DELETE'])
@jwt_required()
@role_required('BusiAdmin')
def deleteTopic(id):
    topic = db.topics.find_one({'_id': ObjectId(id)})
    if topic:
        result = db.topics.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            deleted_count = db.fields.delete_many({'topic': topic.get('name')}).deleted_count
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"Topic <b data-time='{get_time()}'>{topic.get('name')}</b> Deleted Successfully"
                    + (f", {deleted_count} Field(s) deleted" if deleted_count > 0 else ""),
                }
            })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to delete topic: id <b data-time='{get_time()}'>{id}</b> not found", 
            }
        })
