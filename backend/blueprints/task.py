from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Task, TaskList, User, WG, user_task
from decorators import token_required
from datetime import datetime

task_bp = Blueprint('task_bp', __name__)

def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and (user in wg.admins or user == wg.creator)

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

# Task Schema Template (used for all responses)
TASK_SCHEMA = {
    'type': 'object',
    'properties': {
        'id': {
            'type': 'integer',
            'description': 'The unique identifier of the task.'
        },
        'title': {
            'type': 'string',
            'description': 'The title of the task.'
        },
        'description': {
            'type': 'string',
            'nullable': True,
            'description': 'The description of the task.'
        },
        'is_done': {
            'type': 'boolean',
            'description': 'Completion status of the task.'
        },
        'start_date': {
            'type': 'string',
            'format': 'date-time',
            'nullable': True,
            'description': 'The start date and time of the task.'
        },
        'end_date': {
            'type': 'string',
            'format': 'date-time',
            'nullable': True,
            'description': 'The end/due date and time of the task.'
        },
        'tasklist_id': {
            'type': 'integer',
            'description': 'The ID of the parent Task List.'
        },
        'users': {
            'type': 'array',
            'description': 'List of users assigned to the task.',
            'items': {
                'type': 'object',
                'properties': {
                    'idUser': {'type': 'integer'},
                    'username': {'type': 'string'}
                    # Add other user properties if serialized here
                }
            }
        }
    }
}


@task_bp.route('/task/<string:task_id>', methods=['GET'])
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
          description: The ID of the task to retrieve.
    responses:
      200:
        description: Task retrieved successfully
        content:
          application/json:
            schema:
              $TASK_SCHEMA
      403:
        description: Not authorized (user not assigned or not WG admin)
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


@task_bp.route('/task/<string:task_id>', methods=['PUT'])
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
          description: The ID of the task to update.
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              title:
                type: string
                description: The new title for the task.
              description:
                type: string
                description: The new description for the task.
              start_date:
                type: string
                format: date-time
                description: The new start date/time (ISO 8601 format).
              end_date:
                type: string
                format: date-time
                description: The new end date/time (ISO 8601 format).
              is_done:
                type: boolean
                description: New completion status of the task.
              user_ids:
                type: array
                description: List of User IDs to be assigned to the task (replaces current assignments).
                items:
                  type: integer
    responses:
      200:
        description: Task updated
        content:
          application/json:
            schema:
              $TASK_SCHEMA
      403:
        description: Not authorized (user not in TaskList or not WG admin)
      404:
        description: Task not found
      400:
        description: Invalid input (e.g., bad date format)
      500:
        description: Error updating task users
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

    # Update assigned users if provided (logic omitted for brevity, docstring is the focus)
    if 'user_ids' in data:
        try:
            # ... existing user update logic ...
            # Get current users assigned to this task
            current_task_user_ids = {user.idUser for user in task.users}
            
            # Get new user IDs
            new_user_ids = set(data['user_ids'])
            
            # Get only existing users (filter out invalid user IDs)
            existing_users = User.query.filter(User.idUser.in_(new_user_ids)).all()
            existing_user_ids = {user.idUser for user in existing_users}
            
            # Use only valid user IDs for the update
            new_user_ids = existing_user_ids
            
            # Update task users directly
            task.users = existing_users
            
            # Commit task user changes first
            db.session.commit()
            
            # Now handle tasklist user management
            current_tasklist_user_ids = {user.idUser for user in tasklist.users}
            
            # Find users that were added to this task
            added_user_ids = new_user_ids - current_task_user_ids
            
            # Find users that were removed from this task 
            removed_user_ids = current_task_user_ids - new_user_ids
            
            # Add new users to tasklist if they're not already there
            for user_id in added_user_ids:
                if user_id not in current_tasklist_user_ids:
                    # Use raw SQL to avoid SQLAlchemy relationship issues
                    db.session.execute(
                        db.text("INSERT INTO user_tasklist (user_id, tasklist_id) VALUES (:user_id, :tasklist_id)"),
                        {"user_id": user_id, "tasklist_id": tasklist.idTaskList}
                    )
            
            # Check if removed users should be removed from tasklist
            for user_id in removed_user_ids:
                if user_id in current_tasklist_user_ids:
                    # Check if this user is assigned to any other tasks in this tasklist
                    other_tasks_count = db.session.execute(
                        db.text("""
                            SELECT COUNT(*) 
                            FROM user_task ut 
                            JOIN TASK t ON ut.task_id = t.idTask 
                            WHERE t.tasklist_id = :tasklist_id 
                            AND t.idTask != :current_task_id 
                            AND ut.user_id = :user_id
                        """),
                        {
                            "tasklist_id": tasklist.idTaskList,
                            "current_task_id": task.idTask,
                            "user_id": user_id
                        }
                    ).scalar()
                    
                    # If user is not assigned to any other task in this tasklist, remove them
                    if other_tasks_count == 0:
                        db.session.execute(
                            db.text("DELETE FROM user_tasklist WHERE user_id = :user_id AND tasklist_id = :tasklist_id"),
                            {"user_id": user_id, "tasklist_id": tasklist.idTaskList}
                        )
            
            # Commit all changes
            db.session.commit()
            
        except Exception as e:
            # Rollback in case of any error
            db.session.rollback()
            return jsonify({'message': f'Error updating task users: {str(e)}'}), 500
    else:
        # No user_ids provided, just commit other changes
        db.session.commit()

    # Refresh the task to get updated relationships
    db.session.refresh(task)
    return jsonify(serialize_task(task)), 200

@task_bp.route('/task/<string:task_id>', methods=['DELETE'])
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
          description: The ID of the task to delete.
    responses:
      204:
        description: Task deleted successfully
      403:
        description: Not authorized (user not a WG admin)
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

@task_bp.route('/tasks/undone/wg/<string:wg_id>', methods=['GET'])
@token_required
def get_undone_tasks_for_wg(wg_id):
    """
    Get all undone tasks for the current user in a given WG
    ---
    tags:
      - Task
    security:
      - Bearer: []
    parameters:
      - in: path
        name: wg_id
        schema:
          type: integer
        required: true
        description: ID of the WG
    responses:
      200:
        description: List of undone tasks for the user in the WG
        content:
          application/json:
            schema:
              type: array
              items:
                $TASK_SCHEMA
      404:
        description: WG not found or user not in WG
    """
    # check if WG exists and user is part of it
    wg = WG.query.get(wg_id)
    if not wg or g.current_user not in wg.users:
        return jsonify({"message": "WG not found or user not in WG"}), 404

    # query undone tasks for current user within this WG
    tasks = (
        Task.query
        .join(TaskList)
        .filter(
            Task.users.contains(g.current_user),
            Task.is_done == False,
            TaskList.wg_id == wg_id
        )
        .all()
    )

    return jsonify([serialize_task(task) for task in tasks]), 200

@task_bp.route('/task/<string:task_id>/check', methods=['POST'])
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
      tasklist.is_checked = False
      db.session.commit()
      return jsonify({'message': 'Task marked as not done'}), 200
    else:
      task.is_done = True
      # Check if all tasks in the tasklist are done
      all_done = all(t.is_done for t in tasklist.tasks)
      if all_done:
          tasklist.is_checked = True
      db.session.commit()
      return jsonify({'message': 'Task marked as done'}), 200
    

@task_bp.route('/task/<string:task_id>/assign_users', methods=['POST'])
@token_required
def assign_users_to_task(task_id):
    """
    Assign users to a task
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
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    tasklist = TaskList.query.get(task.tasklist_id)
    if not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        
        # Add users to the task
        users_to_add = User.query.filter(User.idUser.in_(user_ids)).all()
        task.users.extend(users_to_add)
        db.session.commit()
        
        # Also add them to the tasklist if they aren't already
        for user_id in user_ids:
            if not any(u.idUser == user_id for u in tasklist.users):
                user_to_add = User.query.get(user_id)
                if user_to_add:
                    tasklist.users.append(user_to_add)
        db.session.commit()
        return jsonify({'message': 'Users assigned to task successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error assigning users to task: {str(e)}'}), 500

@task_bp.route('/task/<string:task_id>/remove_users', methods=['POST'])
@token_required
def remove_users_from_task(task_id):
    """
    Unassign users from a task
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
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      200:
        description: Users unassigned from task successfully
      403:
        description: Not authorized
      404:
        description: Task not found
    """
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': 'Task not found'}), 404
    
    tasklist = TaskList.query.get(task.tasklist_id)
    if not is_admin_of_wg(g.current_user, tasklist.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    user_ids_to_remove = data.get('user_ids', [])

    if not user_ids_to_remove:
        return jsonify({'message': 'No user IDs provided'}), 400

    try:
        # Remove users from the task
        db.session.query(user_task).filter(
            user_task.c.task_id == task_id,
            user_task.c.user_id.in_(user_ids_to_remove)
        ).delete(synchronize_session=False)
        db.session.commit()
        
        # Check if removed users should be removed from tasklist
        for user_id in user_ids_to_remove:
            user_in_tasklist = False
            for other_task in tasklist.tasks:
                if other_task.idTask != task_id and any(u.idUser == user_id for u in other_task.users):
                    user_in_tasklist = True
                    break
            
            if not user_in_tasklist:
                user_to_remove = User.query.get(user_id)
                if user_to_remove and user_to_remove in tasklist.users:
                    tasklist.users.remove(user_to_remove)
        db.session.commit()
        return jsonify({'message': 'Users unassigned from task successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error unassigning users from task: {str(e)}'}), 500