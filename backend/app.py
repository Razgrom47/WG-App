from flask import Flask
from config import Config
from extensions import db, bcrypt, migrate, swagger
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all domains (adjust as needed)
    CORS(app, origins=["*"], supports_credentials=True)

    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db) 
    swagger.init_app(app)
    with app.app_context():
        db.create_all()  # Create tables if they do not exist

    # Register blueprints
    from blueprints.auth import auth_bp
    from blueprints.user import user_bp
    from blueprints.wg import wg_bp
    from blueprints.task_list import task_list_bp
    from blueprints.task import task_bp
    from blueprints.shopping_list import shopping_list_bp
    from blueprints.item import item_bp
    from blueprints.budget_planning import budget_planning_bp
    from blueprints.cost import cost_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(wg_bp)
    app.register_blueprint(task_list_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(shopping_list_bp)
    app.register_blueprint(item_bp)
    app.register_blueprint(budget_planning_bp)
    app.register_blueprint(cost_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=7701, host="0.0.0.0")
