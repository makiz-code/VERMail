from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from config.mongo import get_db
from config.utils import get_time
from config.access import role_required
from libs.VERMod import get_device, init_tokenizer, data_preparation, training_process, get_metrics, reset_model

model_bp = Blueprint('model_bp', __name__)
db = get_db()

@model_bp.route('/dataset/', methods=["GET"])
@jwt_required()
@role_required('BusiAdmin')
def getDataset():
    try:
        topic_names = [topic['name'] for topic in db.topics.find({'state': True}, {'_id': 0, 'name': 1})]
        rows = list(db.dataset.find({'topic': {'$in': topic_names}}, {'_id': 0}))
        
        if rows:
            stats = data_preparation(rows)
            device = get_device()
            return jsonify({
                'data': {
                    'stats': stats,
                    'device': device,
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "warning",
                    'msg': f"Unable to get dataset: <b data-time='{get_time()}'></b> dataset is empty",
                }
            })
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to get dataset: <b data-time='{get_time()}'></b>{str(e)}",
            }
        })

@model_bp.route('/dataset/', methods=["DELETE"])
@jwt_required()
@role_required('BusiAdmin')
def dropDataset():
    try:
        db.dataset.drop()
        return jsonify({
            'notif': {
                'type': "success",
                'msg': f"Dataset has been deleted successfully<b data-time='{get_time()}'></b>",
            },
        })
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to delete dataset: <b data-time='{get_time()}'></b>{str(e)}",
            }
        })

@model_bp.route('/', methods=["POST"])
@jwt_required()
@role_required('BusiAdmin')
def trainModel():
    num_epochs = request.json['numEpochs']
    batch_size = request.json['batchSize']
    max_len = request.json['maxLen']
    learning_rate = request.json['learningRate']

    topic_names = [topic['name'] for topic in db.topics.find({'state': True}, {'_id': 0, 'name': 1})]

    rows = []
    for row in db.dataset.find({'topic': {'$in': topic_names}}, {'_id': 0}):
        rows.append(row)

    try:
        tokenizer = init_tokenizer()
        best_metrics = training_process(tokenizer, rows, num_epochs, batch_size, max_len, learning_rate)
        return jsonify({
            'notif': {
                'type': "success",
                'msg': f"Model trained successfully on the dataset<b data-time='{get_time()}'></b>",
            },
            'data': best_metrics,
        })
    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to train model: <b data-time='{get_time()}'></b>{str(e)}",
            }
        })

@model_bp.route('/', methods=["GET"])
@jwt_required()
@role_required('BusiAdmin')
def getMetrics():
    best_metrics = get_metrics()
    if best_metrics:
        return jsonify({
            'data': best_metrics,
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"No model metrics to load<b data-time='{get_time()}'></b>",
            },
        })

@model_bp.route('/', methods=["DELETE"])
@jwt_required()
@role_required('BusiAdmin')
def resetModel():
    result = reset_model("backend/src/data/models")
    if result:
        return jsonify({
            'notif': {
                'type': "success",
                'msg': f"Model has been reset successfully<b data-time='{get_time()}'></b>",
            },
        })
    else:
        return jsonify({
            'notif': {
                'type': "warning",
                'msg': f"Unable to reset model: <b data-time='{get_time()}'></b>No model were found",
            },
        })
