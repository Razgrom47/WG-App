from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flasgger import Swagger

db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()
swagger = Swagger()