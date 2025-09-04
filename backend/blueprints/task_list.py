from flask import Blueprint, request, jsonify, g
from extensions import db
from models import TaskList, Task, User, WG
from decorators import token_required

task_list_bp = Blueprint('task_list_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.admins

def serialize_tasklist(tasklist):
    return {
        'id': tasklist.idTaskList,
        'title': tasklist.title,
        'description': tasklist.description,
        'date': tasklist.date,
        'is_checked': tasklist.is_checked,
        'wg_id': tasklist.wg_id,
        'users': [{'id': u.idUser, 'name': u.strUser} for u in tasklist.users],
        'tasks': [
            {
                'id': t.idTask,
                'title': t.title,
                'description': t.description,
                'is_done': t.is_done,
                'start_date': t.start_date,
                'end_date': t.end_date,
                'users': [{'id': u.idUser, 'name': u.strUser} for u in t.users]
            } for t in tasklist.tasks
        ]
    }

@task_list_bp.route('/tasklist', methods=['POST'])
@token_required
def create_task_list():
    """
    Create a new task list
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              wg_id:
                type: integer
              title:
                type: string
              description:
                type: string
    responses:
      201:
        description: Task list created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskList'
      403:
        description: Not authorized
      400:
        description: Invalid input
    """
    data = request.get_json()
    wg_id = data['wg_id']
    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    new_task_list = TaskList(
        title=data['title'],
        description=data.get('description'),
        wg_id=wg_id
    )
    db.session.add(new_task_list)
    db.session.commit()
    return jsonify(serialize_tasklist(new_task_list)), 201

@task_list_bp.route('/tasklist/<int:tasklist_id>', methods=['DELETE'])
@token_required
def delete_task_list(tasklist_id):
    """
    Delete a task list
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    parameters:
      - name: tasklist_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Task list deleted successfully
      403:
        description: Not authorized
      404:
        description: Task list not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list:
        return jsonify({'message': 'Task list not found'}), 404
    if not is_admin_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    db.session.delete(task_list)
    db.session.commit()
    return jsonify({'message': 'Task list deleted successfully'}), 204

@task_list_bp.route('/tasklist/<int:tasklist_id>/add_task', methods=['POST'])
@token_required
def add_task(tasklist_id):
    """
    Add a task to a task list
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    parameters:
      - name: tasklist_id
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
    responses:
      201:
        description: Task created
      403:
        description: Not authorized
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list or not is_user_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    task = Task(
        title=data['title'],
        description=data.get('description'),
        tasklist_id=tasklist_id
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.idTask, 'title': task.title}), 201

@task_list_bp.route('/tasklist/<int:tasklist_id>/add_task_from_template', methods=['POST'])
@token_required
def add_task_from_template(tasklist_id):
    """
    Add a task from a template to a task list
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    parameters:
      - name: tasklist_id
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
              template_id:
                type: integer
    responses:
      201:
        description: Task created from template
      403:
        description: Not authorized
      404:
        description: Template task not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list or not is_user_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    template_task = Task.query.get(data['template_id'])
    if template_task and template_task.is_template:
        new_task = Task(
            title=template_task.title,
            description=template_task.description,
            tasklist_id=tasklist_id,
            start_date=template_task.start_date,
            end_date=template_task.end_date,
            is_template=False
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify({'id': new_task.idTask, 'title': new_task.title}), 201
    return jsonify({'message': 'Template task not found'}), 404

@task_list_bp.route('/tasklist/create_template', methods=['POST'])
@token_required
def create_task_template():
    """
    Create a new task template
    ---
    tags:
      - TaskList
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
    responses:
      201:
        description: Task template created
    """
    data = request.get_json()
    # Any user can create a template
    template_task = Task(
        title=data['title'],
        description=data.get('description'),
        is_template=True
    )
    db.session.add(template_task)
    db.session.commit()
    return jsonify({'id': template_task.idTask, 'title': template_task.title}), 201

@task_list_bp.route('/tasklist/<int:tasklist_id>/assign_users', methods=['POST'])
@token_required
def assign_users_to_task(tasklist_id):
    """
    Assign users to a task
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    parameters:
      - name: tasklist_id
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
              task_id:
                type: integer
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      200:
        description: Users assigned to task successfully
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list or not is_user_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    task = Task.query.get(data['task_id'])
    if task and task.tasklist_id == tasklist_id:
        users = User.query.filter(User.idUser.in_(data['user_ids'])).all()
        task.users = users
        db.session.commit()
        return jsonify({'message': 'Users assigned to task successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

@task_list_bp.route('/tasklist/<int:tasklist_id>/check_task', methods=['POST'])
@token_required
def check_task(tasklist_id):
    """
    Mark a task as done
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    parameters:
      - name: tasklist_id
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
              task_id:
                type: integer
    responses:
      200:
        description: Task checked successfully
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list or not is_user_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    task = Task.query.get(data['task_id'])
    if task and task.tasklist_id == tasklist_id:
        task.is_done = True
        db.session.commit()
        return jsonify({'message': 'Task checked successfully'}), 200
    return jsonify({'message': 'Task not found'}), 404

@task_list_bp.route('/tasklist/<int:tasklist_id>', methods=['PUT'])
@token_required
def update_tasklist(tasklist_id):
    """
    Update a task list
    ---
    tags:
      - TaskList
    security:
      - Bearer: []
    parameters:
      - name: tasklist_id
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
    responses:
      200:
        description: Task list updated
      403:
        description: Not authorized
      404:
        description: Task list not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list:
        return jsonify({'message': 'Task list not found'}), 404
    if not is_admin_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    task_list.title = data.get('title', task_list.title)
    task_list.description = data.get('description', task_list.description)
    db.session.commit()
    return jsonify(serialize_tasklist(task_list)), 200