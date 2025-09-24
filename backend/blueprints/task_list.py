from datetime import datetime
from flask import Blueprint, request, jsonify, g
from extensions import db
from models import TaskList, Task, User, WG, user_tasklist
from decorators import token_required

task_list_bp = Blueprint('task_list_bp', __name__)


def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users


def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and (user in wg.admins or user == wg.creator)


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


@task_list_bp.route('/tasklist/<string:tasklist_id>', methods=['GET'])
@token_required
def get_task_list(tasklist_id):
    """
    Get a task list
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
      200:
        description: Task list retrieved successfully
      403:
        description: Not authorized
      404:
        description: Task list not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list:
        return jsonify({'message': 'Task list not found'}), 404
    if not (is_user_of_wg(g.current_user, task_list.wg_id) or is_admin_of_wg(g.current_user, task_list.wg_id)):
        return jsonify({'message': 'Not authorized'}), 403
    return jsonify(serialize_tasklist(task_list)), 200



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
              date:
                type: string
                format: date
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

    # Handle the optional date field
    task_date_str = data.get('date')
    task_date = datetime.fromisoformat(task_date_str) if task_date_str else None

    new_task_list = TaskList(
        title=data['title'],
        description=data.get('description'),
        date=task_date,
        wg_id=wg_id
    )
    # Assign the creator to the task list
    new_task_list.users.append(g.current_user)
    db.session.add(new_task_list)
    db.session.commit()
    return jsonify(serialize_tasklist(new_task_list)), 201


@task_list_bp.route('/tasklist/<string:tasklist_id>', methods=['DELETE'])
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


@task_list_bp.route('/tasklist/<string:tasklist_id>/add_task', methods=['POST'])
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
    # Convert start_date and end_date to datetime objects
    try:
        start_date = datetime.fromisoformat(data['start_date']) if 'start_date' in data else None
        end_date = datetime.fromisoformat(data['end_date']) if 'end_date' in data else None
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use ISO 8601 format.'}), 400

    task = Task(
        title=data['title'],
        description=data.get('description'),
        tasklist_id=tasklist_id,
        start_date=start_date,
        end_date=end_date,
        is_done=False,
        is_template=False,
    )
    task_list.is_checked = False
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.idTask, 'title': task.title}), 201


# @task_list_bp.route('/tasklist/<string:tasklist_id>/add_task_from_template', methods=['POST'])
# @token_required
# def add_task_from_template(tasklist_id):
#     """
#     Add a task from a template to a task list
#     ---
#     tags:
#       - TaskList
#     security:
#       - Bearer: []
#     parameters:
#       - name: tasklist_id
#         in: path
#         required: true
#         schema:
#           type: integer
#     requestBody:
#       required: true
#       content:
#         application/json:
#           schema:
#             type: object
#             properties:
#               template_id:
#                 type: integer
#     responses:
#       201:
#         description: Task created from template
#       403:
#         description: Not authorized
#       404:
#         description: Template task not found
#     """
#     task_list = TaskList.query.get(tasklist_id)
#     if not task_list or not is_user_of_wg(g.current_user, task_list.wg_id):
#         return jsonify({'message': 'Not authorized'}), 403
#     data = request.get_json()
#     template_task = Task.query.get(data['template_id'])
#     if template_task and template_task.is_template:
#         new_task = Task(
#             title=template_task.title,
#             description=template_task.description,
#             tasklist_id=tasklist_id,
#             start_date=template_task.start_date,
#             end_date=template_task.end_date,
#             is_template=False
#         )
#         db.session.add(new_task)
#         db.session.commit()
#         return jsonify({'id': new_task.idTask, 'title': new_task.title}), 201
#     return jsonify({'message': 'Template task not found'}), 404


# @task_list_bp.route('/tasklist/create_template', methods=['POST'])
# @token_required
# def create_task_template():
#     """
#     Create a new task template
#     ---
#     tags:
#       - TaskList
#     security:
#       - Bearer: []
#     requestBody:
#       required: true
#       content:
#         application/json:
#           schema:
#             type: object
#             properties:
#               title:
#                 type: string
#               description:
#                 type: string
#     responses:
#       201:
#         description: Task template created
#     """
#     data = request.get_json()
#     # Any user can create a template
#     template_task = Task(
#         title=data['title'],
#         description=data.get('description'),
#         is_template=True
#     )
#     db.session.add(template_task)
#     db.session.commit()
#     return jsonify({'id': template_task.idTask, 'title': template_task.title}), 201


@task_list_bp.route('/tasklist/<string:tasklist_id>/assign_users', methods=['POST'])
@token_required
def assign_users_to_tasklist(tasklist_id):
    """
    Assign users to a task list
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
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      200:
        description: Users assigned to task list successfully
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
    users = User.query.filter(User.idUser.in_(data['user_ids'])).all()
    task_list.users.extend(users)
    db.session.commit()
    return jsonify({'message': 'Users assigned to task list successfully'}), 200


@task_list_bp.route('/tasklist/<string:tasklist_id>/remove_users', methods=['POST'])
@token_required
def remove_users_from_tasklist(tasklist_id):
    """
    Unassign users from a task list
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
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      200:
        description: Users unassigned from task list successfully
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
    user_ids_to_remove = data.get('user_ids', [])

    if not user_ids_to_remove:
        return jsonify({'message': 'No user IDs provided'}), 400

    # Explicitly delete from the association table
    db.session.query(user_tasklist).filter(
        user_tasklist.c.tasklist_id == tasklist_id,
        user_tasklist.c.user_id.in_(user_ids_to_remove)
    ).delete(synchronize_session=False)

    db.session.commit()
    
    return jsonify({'message': 'Users unassigned from task list successfully'}), 200


@task_list_bp.route('/tasklist/<string:tasklist_id>/check_tasklist', methods=['POST'])
@token_required
def check_tasklist(tasklist_id):
    """
    Mark a task list as checked and all its tasks as done
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
      200:
        description: Task list and tasks checked successfully
      403:
        description: Not authorized
      404:
        description: Task list not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list:
        return jsonify({'message': 'Task list not found'}), 404

    # Check if the user is part of the WG
    if not is_user_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized: User is not part of the WG'}), 403

    # Check if the user is either in the task list's users or is an admin of the WG
    if g.current_user not in task_list.users and not is_admin_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized: User is not assigned to the task list or is not an admin'}), 403

    # Mark the task list as checked
    task_list.is_checked = True

    # Mark all tasks in the task list as done
    for task in task_list.tasks:
        task.is_done = True

    db.session.commit()
    return jsonify({'message': 'Task list and tasks checked successfully'}), 200


@task_list_bp.route('/tasklist/<string:tasklist_id>/uncheck_tasklist', methods=['POST'])
@token_required
def uncheck_tasklist(tasklist_id):
    """
    Uncheck a task list
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
      200:
        description: Task list unchecked successfully
      403:
        description: Not authorized
      404:
        description: Task list not found
    """
    task_list = TaskList.query.get(tasklist_id)
    if not task_list:
        return jsonify({'message': 'Task list not found'}), 404

    # Check if the user is part of the WG
    if not is_user_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized: User is not part of the WG'}), 403

    # Check if the user is either in the task list's users or is an admin of the WG
    if g.current_user not in task_list.users and not is_admin_of_wg(g.current_user, task_list.wg_id):
        return jsonify({'message': 'Not authorized: User is not assigned to the task list or is not an admin'}), 403

    # Uncheck the task list
    task_list.is_checked = False

    db.session.commit()
    return jsonify({'message': 'Task list unchecked successfully'}), 200


@task_list_bp.route('/tasklist/<string:tasklist_id>', methods=['PUT'])
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
