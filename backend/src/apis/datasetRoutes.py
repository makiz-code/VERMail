import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from config.mongo import get_db
from config.utils import get_time
from config.access import role_required
from libs.MailKit import cleanup_records_folder
from libs.VERData import init_sentence, init_pipes, get_files, filter_by_topics
from libs.VERData import data_extraction, data_cleaning, data_labeling, data_reduction, data_augmentation

dataset_bp = Blueprint('dataset_bp', __name__)
db = get_db()

upload_path = "backend/src/data/uploads"

@dataset_bp.route('/', methods=["POST"])
@jwt_required()
@role_required('BusiAdmin')
def uploadFile():
    try:
        if "file" not in request.files:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to upload file: <b data-time='{get_time()}'></b>No file part", 
                }
            })

        file = request.files["file"]
        if file.filename == "":
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to upload file: <b data-time='{get_time()}'></b>No selected file", 
                }
            })

        os.makedirs(upload_path, exist_ok=True)
        path = os.path.join(upload_path, file.filename)

        file.save(path)
    
        result = data_extraction(path, path)
        if result == True:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"File <b data-time='{get_time()}'>{file.filename}</b> uploaded successfully", 
                }
            })
        else:
            os.remove(path)
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to upload dataset: <b data-time='{get_time()}'>{file.filename}</b> is empty", 
                }
            })
    except Exception as e:
            os.remove(path)
            return jsonify({
                'notif': {
                    'type': "danger", 
                    'msg': f"Failed to upload dataset: <b data-time='{get_time()}'>{file.filename}</b> {str(e)}", 
                }
            })

@dataset_bp.route('/files/', methods=["POST"])
@jwt_required()
@role_required('BusiAdmin')
def uploadFiles():
    try:
        if "folder" not in request.files:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to upload file: <b data-time='{get_time()}'></b>No file parts",
                }
            })

        files = request.files.getlist("folder")
        if len(files) == 0:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to upload file: <b data-time='{get_time()}'></b>No selected files",
                }
            })

        src_path = "backend/src/data/uploads/mails"
        dest_path = "backend/src/data/uploads/eml-auto-data.csv"

        os.makedirs(src_path, exist_ok=True)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)

        for file in files:
            if file.filename != "":
                file.save(os.path.join(src_path, file.filename))

        result = data_extraction(src_path, dest_path)
        cleanup_records_folder(src_path)
        if result == True:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"File <b data-time='{get_time()}'>eml-auto-data.csv</b> uploaded successfully", 
                }
            })
    except Exception as e:
            os.remove(dest_path)
            return jsonify({
                'notif': {
                    'type': "danger", 
                    'msg': f"Failed to upload dataset: <b data-time='{get_time()}'></b>{str(e)}", 
                }
            })

@dataset_bp.route('/', methods=["GET"])
@jwt_required()
@role_required('BusiAdmin')
def getFiles():
    os.makedirs(upload_path, exist_ok=True)

    files = []
    if os.path.exists(upload_path) and os.path.isdir(upload_path):
        dir_files = os.listdir(upload_path)
        filenames = [file for file in dir_files if os.path.isfile(os.path.join(upload_path, file))]
        if filenames:
            files = [get_files(os.path.join(upload_path,filename)) for filename in filenames]
        return jsonify({
            'notif': {
                'type': "success",
                'msg': f"Files <b data-time='{get_time()}'></b>fetched successfully", 
            },
            'data': files,
        })
    else:
        return jsonify({
            'notif': {
                'type': "danger", 
                'msg': f"Folder does not exist or is not a directory<b data-time='{get_time()}'></b>", 
            }
        })

@dataset_bp.route('/<filename>/', methods=["DELETE"])
@jwt_required()
@role_required('BusiAdmin')
def deleteFile(filename):
    try:
        os.makedirs(upload_path, exist_ok=True)
        path = os.path.join(upload_path, filename)

        if os.path.exists(path):
            os.remove(path)
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"File <b data-time='{get_time()}'>{filename}</b> deleted successfully.",
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to delete file: File <b data-time='{get_time()}'>{filename}</b> not found.",
                }
            })

    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to delete file: <b data-time='{get_time()}'>{filename}</b> {str(e)}",
            }
        })

@dataset_bp.route('/clean/<filename>/', methods=["POST"])
@jwt_required()
@role_required('BusiAdmin')
def cleanDataset(filename):
    try:
        os.makedirs(upload_path, exist_ok=True)
        path = os.path.join(upload_path, filename)

        sentence = init_sentence()
        result = data_cleaning(sentence, path)
        if result == True:
            topics_cursor = db.topics.find({"state": True}, {"name": 1})
            topics = [topic["name"] for topic in topics_cursor]
            json_data = filter_by_topics(path, topics)
            if json_data:
                return jsonify({
                    'notif': {
                        'type': "success",
                        'msg': f"File <b data-time='{get_time()}'>{filename}</b> cleaned successfully",
                    },
                    'data': {
                        'emails': json_data,
                        'topics': topics,
                    }
                })
        else:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to clean file: <b data-time='{get_time()}'>{filename}</b> is empty",
                }
            })

    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to clean file: <b data-time='{get_time()}'>{filename}</b> {str(e)}",
            }
        })

@dataset_bp.route('/label/<filename>/', methods=["POST"])
@jwt_required()
@role_required('BusiAdmin')
def labelDataset(filename):
    try:
        os.makedirs(upload_path, exist_ok=True)
        path = os.path.join(upload_path, filename)
        json_data = request.json

        result = data_labeling(path, json_data=json_data)
        if result == True:
            return jsonify({
                'notif': {
                    'type': "success",
                    'msg': f"File changes saved to <b data-time='{get_time()}'>{filename}</b>",
                }
            })
        else:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to save changes: <b data-time='{get_time()}'>{filename}</b> is empty",
                }
            })

    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to save changes: <b data-time='{get_time()}'>{filename}</b> {str(e)}",
            }
        })
    
@dataset_bp.route('/transform/<filename>/', methods=["POST"])
@jwt_required()
@role_required('BusiAdmin')
def transformDataset(filename):
    try:
        os.makedirs(upload_path, exist_ok=True)
        path = os.path.join(upload_path, filename)

        actions = {}
        action_cursor = db.topics.find({"state": True}, {"name": 1, "desc": 1})
        for item in action_cursor:
            actions[item["name"]] = item["desc"]

        sentence = init_sentence()
        condition = data_reduction(sentence, path, actions)
        if condition == True:
            tokenizer, model = init_pipes()
            condition, data, stats = data_augmentation(tokenizer, model, path)
            if condition == True:
                result = db.dataset.insert_many(data)
                if result.inserted_ids:
                    return jsonify({
                        'notif': {
                            'type': "success",
                            'msg': f"File <b data-time='{get_time()}'>{filename}</b> saved succesfully to global dataset",
                        },
                        'data': stats,
                    })
                else:
                    return jsonify({
                        'notif': {
                            'type': "danger",
                            'msg': f"Failed to augmente file <b data-time='{get_time()}'>{filename}</b> is empty",
                        },
                    })
        else:
            return jsonify({
                'notif': {
                    'type': "danger",
                    'msg': f"Failed to reduce file: <b data-time='{get_time()}'>{filename}</b> is empty",
                }
            })

    except Exception as e:
        return jsonify({
            'notif': {
                'type': "danger",
                'msg': f"Failed to transform file: <b data-time='{get_time()}'>{filename}</b> {str(e)}",
            }
        })
