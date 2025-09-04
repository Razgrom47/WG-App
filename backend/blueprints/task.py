from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Task, TaskList, User, WG
from decorators import token_required

task_bp = Blueprint('task_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

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
    if not tasklist or not is_user_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    users = User.query.filter(User.idUser.in_(data.get('user_ids', []))).all()
    new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
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
    if not tasklist or not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.start_date = data.get('start_date', task.start_date)
    task.end_date = data.get('end_date', task.end_date)
    task.is_done = data.get('is_done', task.is_done)
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
    task = Task.query.get_or_404(task_id)
    tasklist = TaskList.query.get(task.tasklist_id)
    if not tasklist or not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'}),