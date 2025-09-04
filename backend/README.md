# WG App

## Overview
WG App is a Flask-based web application for managing shared living (WG) tasks, users, shopping lists, budgets, and more. It provides a RESTful API with user authentication and CRUD operations for all major entities.

---

## Features

- User authentication and management
- Creation and management of WGs (shared flats)
- Task lists and task management
- Shopping list and item management
- Budget planning and cost tracking

---

## Project Structure

```
wg-app/
├── app.py                  # Application entry point
├── config.py               # Flask configuration
├── extensions.py           # Extensions (SQLAlchemy, Bcrypt, etc.)
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── manage.py               # Migration and management script
├── migrations/             # Database migration scripts
├── blueprints/             # Modular routes and views
│   ├── __init__.py
│   ├── auth.py             # Authentication routes
│   └── user.py             # User management routes
├── models/                 # Database models
│   └── __init__.py
└── instance/
    └── wg_app.db           # SQLite database file
```

---

## Technologies Used

- Python 3.x
- Flask
- Flask-SQLAlchemy
- Flask-Bcrypt
- Flask-Migrate
- Flask-CORS
- SQLite

---

## Setup Instructions

### Prerequisites

- Python 3.x
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wg-app
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configuration**
   - Edit `config.py` if you need to change the database URI or other settings.

---

## Running the Application

1. **Activate the virtual environment**
   ```bash
   venv\Scripts\activate
   ```

2. **Run the application**
   ```bash
   set FLASK_APP=app.py
   set FLASK_RUN_PORT=7700
   set FLASK_RUN_HOST=0.0.0.0
   set FLASK_ENV=development
   flask run
   ```
   The app will be available at [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

## Database Migrations

1. **Initialize migrations (first time only)**
   ```bash
   flask db init
   ```

2. **Create a migration after changing models**
   ```bash
   flask db migrate -m "Update Message"
   ```

3. **Apply migrations**
   ```bash
   flask db upgrade
   ```

---

## API Documentation

- The API is organized using Flask blueprints.
- See the `blueprints/` directory for route definitions and usage examples.
- Main endpoints:
  - `/auth` – User registration and login
  - `/user` – User management
  - Additional endpoints for WGs, tasks, shopping lists, budgets, etc.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

---

## License

This project is licensed under the