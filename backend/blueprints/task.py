from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Task, TaskList, User, WG
from decorators import token_required
from datetime import datetime

task_bp = Blueprint('task_bp', __name__)

def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.admins

def serialize_task(task):
    return {
        'id': task.idTask,
        'title': task.title,
        'description': task.description,
        'start_date': task.start_date,
        'end_date': task.end_date,
        'is_done': task.is_done,
        'is_template': task.is_template,
        'tasklist_id': task.tasklist_id,
        'users': [{'id': u.idUser, 'name': u.strUser} for u in task.users]
    }

@task_bp.route('/task/<int:task_id>', methods=['GET'])
@token_required
def get_task(task_id):
    """
    Get a task
    ---
    tags:
      - Task
    security:
      - Bearer: []
    parameters:
      - name: task_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Task retrieved successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Task'
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': 'Task not found'}), 404

    tasklist = TaskList.query.get(task.tasklist_id)
    if not tasklist:
        return jsonify({'message': 'Task list not found'}), 404

    # Check if the user is either an admin of the WG or assigned to the task
    if not is_admin_of_wg(g.current_user, tasklist.wg_id) and g.current_user not in task.users:
        return jsonify({'message': 'Not authorized'}), 403

    return jsonify(serialize_task(task)), 200

@task_bp.route('/task', methods=['POST'])
@token_required
def create_task():
    """
    Create a new task
    ---
    tags:
      - Task
    security:
      - Bearer: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              title:
                type: string
              description:
                type: string
              start_date:
                type: string
                format: date-time
              end_date:
                type: string
                format: date-time
              tasklist_id:
                type: integer
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      201:
        description: Task created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Task'
      403:
        description: Not authorized
      400:
        description: Invalid input
    """
    data = request.get_json()
    tasklist = TaskList.query.get(data['tasklist_id'])
    if not tasklist or g.current_user not in tasklist.users and not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    # Convert start_date and end_date to datetime objects
    try:
        start_date = datetime.fromisoformat(data['start_date']) if 'start_date' in data else None
        end_date = datetime.fromisoformat(data['end_date']) if 'end_date' in data else None
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use ISO 8601 format.'}), 400

    users = User.query.filter(User.idUser.in_(data.get('user_ids', []))).all()
    new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        start_date=start_date,
        end_date=end_date,
        is_done=False,
        is_template=False,
        tasklist_id=data['tasklist_id'],
        users=users
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(serialize_task(new_task)), 201

@task_bp.route('/task/<int:task_id>', methods=['PUT'])
@token_required
def update_task(task_id):
    """
    Update a task
    ---
    tags:
      - Task
    security:
      - Bearer: []
    parameters:
      - name: task_id
        in: path
        required: true
        schema:
          type: integer
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              title:
                type: string
              description:
                type: string
              start_date:
                type: string
                format: date-time
              end_date:
                type: string
                format: date-time
              is_done:
                type: boolean
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      200:
        description: Task updated
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Task'
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task = Task.query.get_or_404(task_id)
    tasklist = TaskList.query.get(task.tasklist_id)
    if not tasklist or g.current_user not in tasklist.users and not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    data = request.get_json()

    # Update fields
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)

    # Convert start_date and end_date to datetime objects
    if 'start_date' in data:
        try:
            task.start_date = datetime.fromisoformat(data['start_date'])
        except ValueError:
            return jsonify({'message': 'Invalid start_date format. Use ISO 8601 format.'}), 400

    if 'end_date' in data:
        try:
            task.end_date = datetime.fromisoformat(data['end_date'])
        except ValueError:
            return jsonify({'message': 'Invalid end_date format. Use ISO 8601 format.'}), 400

    task.is_done = data.get('is_done', task.is_done)

    # Update assigned users if provided
    if 'user_ids' in data:
        users = User.query.filter(User.idUser.in_(data['user_ids'])).all()
        task.users = users

    db.session.commit()
    return jsonify(serialize_task(task)), 200

@task_bp.route('/task/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(task_id):
    """
    Delete a task
    ---
    tags:
      - Task
    security:
      - Bearer: []
    parameters:
      - name: task_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Task deleted successfully
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': 'Task not found'}), 404

    tasklist = TaskList.query.get(task.tasklist_id)
    if not tasklist:
        return jsonify({'message': 'Task list not found'}), 404

    # Check if the user is an admin of the WG
    if not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    # Delete the task
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'}), 204

@task_bp.route('/tasks/undone', methods=['GET'])
@token_required
def get_undone_tasks():
    """
    Get all undone tasks for the current user
    ---
    tags:
      - Task
    security:
      - Bearer: []
    responses:
      200:
        description: List of undone tasks
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Task'
    """
    tasks = Task.query.filter(Task.users.contains(g.current_user), Task.is_done == False).all()
    return jsonify([serialize_task(task) for task in tasks]), 200

@task_bp.route('/task/<int:task_id>/check', methods=['POST'])
@token_required
def check_task(task_id):
    """
    Mark a task as done
    ---
    tags:
      - Task
    security:
      - Bearer: []
    parameters:
      - name: task_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Task marked as done
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task = Task.query.get(task_id)
    tasklist = TaskList.query.get(task.tasklist_id)
    if not task:
        return jsonify({'message': 'Task not found'}), 404

    # Check if the user is assigned to the task
    if g.current_user not in task.users and not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    # Mark the task as done
    if task.is_done is True:
      task.is_done = False
      db.session.commit()
      return jsonify({'message': 'Task marked as not done'}), 200
    else:
      task.is_done = True
      db.session.commit()
      return jsonify({'message': 'Task marked as done'}), 200