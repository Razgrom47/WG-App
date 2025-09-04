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
- Interactive API documentation with Flasgger (Swagger UI)

---

## Project Structure

```
backend/
├── app.py                  # Application entry point
├── config.py               # Flask configuration
├── decorators.py           # Custom decorators (e.g., authentication)
├── extensions.py           # Extensions (SQLAlchemy, Bcrypt, etc.)
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── blueprints/             # Modular routes and views
│   ├── __init__.py
│   ├── auth.py             # Authentication routes (register, login)
│   ├── user.py             # User management routes
│   ├── wg.py               # WG (shared flat) structure and management
│   ├── shopping_list.py    # Shopping list routes (per WG)
│   ├── item.py             # Item routes (items within a shopping list)
│   ├── budget_planning.py  # Budget planning routes (per WG)
│   ├── cost.py             # Cost routes (costs within budget planning)
│   ├── task_list.py        # Task list routes (per WG)
│   ├── task.py             # Task routes (tasks within a task list)
├── models/                 # Database models
│   └── __init__.py
├── database/
│   ├── create_db.py        # Script to initialize the database
│   └── wg_app.db           # SQLite database file
├── migrations/             # Database migration scripts (Alembic)
│   ├── env.py
│   ├── versions/
│   └── ...
└── __pycache__/            # Python cache files
```

---

## Technologies Used

- Python 3.x
- Flask
- Flask-SQLAlchemy
- Flask-Bcrypt
- Flask-Migrate
- Flask-CORS
- Flasgger (Swagger UI)
- SQLite

---

## Setup Instructions

### Prerequisites

- Python 3.12.5
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Razgrom47/WG-App.git 
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
   The app will be available at [http://127.0.0.1:7700](http://127.0.0.1:7700).

---

## API Documentation

- The API is organized using Flask blueprints.
- See the `blueprints/` directory for route definitions and usage examples.
- Main endpoints:
  - `/auth` – User registration and login
  - `/user` – User management
  - `/wg` – WG (shared flat) structure and management (central entity, includes all related lists)
  - `/shopping_list` – Shopping list management (per WG)
  - `/item` – Item management (items within a shopping list)
  - `/budget_planning` – Budget planning management (per WG)
  - `/cost` – Cost management (costs within budget planning)
  - `/task_list` – Task list management (per WG)
  - `/task` – Task management (tasks within a task list)
- Interactive API documentation is available via Flasgger (Swagger UI) at:
  - [http://127.0.0.1:7700/apidocs/](http://127.0.0.1:7700/apidocs/)
  - Or at `/apidocs` on your running server

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

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

---

## License

This project is licensed under ...