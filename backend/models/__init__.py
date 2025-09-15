from extensions import db
from datetime import datetime

# Association tables for many-to-many relationships
user_wg = db.Table(
    'user_wg',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('wg_id', db.Integer, db.ForeignKey('WG.idWG'))
)

admin_wg = db.Table(
    'admin_wg',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('wg_id', db.Integer, db.ForeignKey('WG.idWG'))
)

user_tasklist = db.Table(
    'user_tasklist',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('tasklist_id', db.Integer, db.ForeignKey('TASKLIST.idTaskList'))
)

user_task = db.Table(
    'user_task',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('task_id', db.Integer, db.ForeignKey('TASK.idTask'))
)

user_shoppinglist = db.Table(
    'user_shoppinglist',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('shoppinglist_id', db.Integer,
              db.ForeignKey('SHOPPINGLIST.idShoppingList'))
)

user_item = db.Table(
    'user_item',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('item_id', db.Integer, db.ForeignKey('ITEM.idItem'))
)

user_budgetplanning = db.Table(
    'user_budgetplanning',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('budgetplanning_id', db.Integer,
              db.ForeignKey('BUDGETPLANNING.idBudgetPlanning'))
)

user_cost = db.Table(
    'user_cost',
    db.Column('user_id', db.Integer, db.ForeignKey('USERS.idUser')),
    db.Column('cost_id', db.Integer, db.ForeignKey('COST.idCost'))
)


class User(db.Model):
    __tablename__ = 'USERS'
    idUser = db.Column(db.Integer, primary_key=True)
    strUser = db.Column(db.String(80), nullable=False)
    strPassword = db.Column(db.String(128), nullable=False)
    strEmail = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    wgs = db.relationship('WG', secondary=user_wg, back_populates='users')
    admin_wgs = db.relationship(
        'WG', secondary=admin_wg, back_populates='admins')
    tasklists = db.relationship(
        'TaskList', secondary=user_tasklist, back_populates='users')
    tasks = db.relationship('Task', secondary=user_task,
                            back_populates='users')
    shoppinglists = db.relationship(
        'ShoppingList', secondary=user_shoppinglist, back_populates='users')
    items = db.relationship('Item', secondary=user_item,
                            back_populates='users')
    budgetplannings = db.relationship(
        'BudgetPlanning', secondary=user_budgetplanning, back_populates='users')
    costs = db.relationship('Cost', secondary=user_cost,
                            back_populates='users')
    __table_args__ = (
        db.UniqueConstraint('strUser', name='uq_user_strUser'),
        db.UniqueConstraint('strEmail', name='uq_user_strEmail'),
    )


class WG(db.Model):
    __tablename__ = 'WG'
    idWG = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    etage = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    creator_id = db.Column(db.Integer, db.ForeignKey(
        'USERS.idUser', name='fk_wg_creator'), nullable=False)
    creator = db.relationship('User', foreign_keys=[creator_id])
    users = db.relationship('User', secondary=user_wg, back_populates='wgs')
    admins = db.relationship('User', secondary=admin_wg,
                             back_populates='admin_wgs')
    shoppinglists = db.relationship(
        'ShoppingList', back_populates='wg', cascade="all, delete-orphan")
    tasklists = db.relationship(
        'TaskList', back_populates='wg', cascade="all, delete-orphan")
    budgetplannings = db.relationship(
        'BudgetPlanning', back_populates='wg', cascade="all, delete-orphan")
    __table_args__ = (
        db.UniqueConstraint('title', name='uq_wg_title'),
        db.UniqueConstraint('address', 'etage', name='uq_wg_address_etage'),
    )


class TaskList(db.Model):
    __tablename__ = 'TASKLIST'
    idTaskList = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    is_checked = db.Column(db.Boolean, default=False)
    wg_id = db.Column(db.Integer, db.ForeignKey('WG.idWG'))
    wg = db.relationship('WG', back_populates='tasklists')
    users = db.relationship(
        'User', secondary=user_tasklist, back_populates='tasklists'
    )
    tasks = db.relationship(
        'Task', back_populates='tasklist', cascade="all, delete-orphan"
    )


class Task(db.Model):
    __tablename__ = 'TASK'
    idTask = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    is_done = db.Column(db.Boolean, default=False)
    is_template = db.Column(db.Boolean, default=False)
    tasklist_id = db.Column(db.Integer, db.ForeignKey('TASKLIST.idTaskList'))
    tasklist = db.relationship('TaskList', back_populates='tasks')
    users = db.relationship(
        'User', secondary=user_task, back_populates='tasks'
    )


class ShoppingList(db.Model):
    __tablename__ = 'SHOPPINGLIST'
    idShoppingList = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    creator_id = db.Column(db.Integer, db.ForeignKey('USERS.idUser'))
    creator = db.relationship('User', foreign_keys=[creator_id])
    wg_id = db.Column(db.Integer, db.ForeignKey('WG.idWG'))
    wg = db.relationship('WG', back_populates='shoppinglists')
    users = db.relationship(
        'User', secondary=user_shoppinglist, back_populates='shoppinglists')
    items = db.relationship(
        'Item', back_populates='shoppinglist', cascade="all, delete-orphan")


class Item(db.Model):
    __tablename__ = 'ITEM'
    idItem = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    is_checked = db.Column(db.Boolean, default=False)
    shoppinglist_id = db.Column(
        db.Integer, db.ForeignKey('SHOPPINGLIST.idShoppingList'))
    shoppinglist = db.relationship('ShoppingList', back_populates='items')
    users = db.relationship(
        'User', secondary=user_item, back_populates='items'
    )


class BudgetPlanning(db.Model):
    __tablename__ = 'BUDGETPLANNING'
    idBudgetPlanning = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    goal = db.Column(db.Float)
    deadline = db.Column(db.DateTime)
    creator_id = db.Column(db.Integer, db.ForeignKey('USERS.idUser'))
    creator = db.relationship('User', foreign_keys=[creator_id])
    wg_id = db.Column(db.Integer, db.ForeignKey('WG.idWG'))
    wg = db.relationship('WG', back_populates='budgetplannings')
    users = db.relationship(
        'User', secondary=user_budgetplanning, back_populates='budgetplannings')
    costs = db.relationship(
        'Cost', back_populates='budgetplanning', cascade="all, delete-orphan")


class Cost(db.Model):
    __tablename__ = 'COST'
    idCost = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    goal = db.Column(db.Float)
    paid = db.Column(db.Float, default=0.0)
    budgetplanning_id = db.Column(
        db.Integer, db.ForeignKey('BUDGETPLANNING.idBudgetPlanning'))
    budgetplanning = db.relationship('BudgetPlanning', back_populates='costs')
    users = db.relationship('User', secondary=user_cost,
                            back_populates='costs')
