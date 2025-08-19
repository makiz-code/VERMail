from config.blibs import *

model_bp = Blueprint('model_bp', __name__)
db = get_db()

@model_bp.route("/dataset", methods=["GET"])
def getDataset():
    try:
        topic_names = [topic['name'] for topic in db.topics.find({'state': True}, {'_id': 0, 'name': 1})]
        rows = list(db.dataset.find({'topic': {'$in': topic_names}}, {'_id': 0}))
        
        if rows:
            from libs.VERMod import data_preparation, get_device
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

@model_bp.route("/dataset", methods=["DELETE"])
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

@model_bp.route("/", methods=["POST"])
def trainModel():
    num_epochs = request.json['numEpochs']
    batch_size = request.json['batchSize']
    max_len = request.json['maxLen']
    learning_rate = request.json['learningRate']

    topic_names = [topic['name'] for topic in db.topics.find({'state': True}, {'_id': 0, 'name': 1})]

    rows = []
    for row in db.dataset.find({'topic': {'$in': topic_names}}, {'_id': 0}):
        rows.append(row)

    from libs.VERMod import training_process
    try:
        best_metrics = training_process(rows, num_epochs, batch_size, max_len, learning_rate)
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

@model_bp.route("/", methods=["GET"])
def getMetrics():
    from libs.VERMod import get_metrics
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

@model_bp.route("/", methods=["DELETE"])
def resetModel():
    from libs.VERMod import reset_model
    result = reset_model("backend/data/models")
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
