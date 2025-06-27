from flask import Flask
from flask_cors import CORS
from apis.mailboxRoutes import mailbox_bp
from apis.senderRoutes import sender_bp
from apis.topicRoutes import topic_bp
from apis.fieldRoutes import field_bp
from apis.datasetRoutes import dataset_bp
from apis.modelRoutes import model_bp
from apis.dashboardRoutes import dashboard_bp
from apis.accountRoutes import account_bp
from apis.loginRoutes import login_bp
from config.DBs import conf_db

app = Flask(__name__)
CORS(app)

app.register_blueprint(mailbox_bp, url_prefix='/mailboxes')
app.register_blueprint(sender_bp, url_prefix='/senders')
app.register_blueprint(topic_bp, url_prefix='/topics')
app.register_blueprint(field_bp, url_prefix='/fields')
app.register_blueprint(dataset_bp, url_prefix='/dataset')
app.register_blueprint(model_bp, url_prefix='/model')
app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
app.register_blueprint(account_bp, url_prefix='/accounts')
app.register_blueprint(login_bp, url_prefix='/login')

conf_db(app)

if __name__ == '__main__':
    app.run(debug=True)
    