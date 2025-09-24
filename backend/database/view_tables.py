import sqlite3, os

cwd = os.path.abspath(os.getcwd())
cwd = os.path.join(cwd, "backend")

db_path = os.path.join(cwd, "database", "wg_app.db")

if not os.path.exists(db_path):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with open(db_path, "w") as file:
        pass

def print_table(conn, table_name):
    try:
        cursor = conn.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]

        if not rows:
            print(f"{table_name}: <empty>")
            return

        # Print header
        header = " | ".join(col_names)
        print(f"\n=== {table_name} ===")
        print(header)
        print("-" * len(header))

        # Print rows
        for row in rows:
            print(" | ".join(str(val) for val in row))

    except sqlite3.OperationalError as e:
        print(f"Table {table_name} not found: {e}")

with sqlite3.connect(db_path) as conn:
    print(f"Opened SQLite database with version {sqlite3.sqlite_version} successfully.")

    # Update some entries
    # conn.execute("DELETE FROM USERS;")
    # conn.execute("UPDATE WG SET creator_id = 3733982 WHERE idWG = 3;")
    # conn.execute("UPDATE USERS SET idUser = 3733981 WHERE strUser = 'admin';")
    # conn.commit()

    # Show existing tables
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    # print("\n=== Tables in DB ===")
    # for t in tables:
    #     delete_statement = f"DELETE FROM {t[0]};"
    #     conn.execute(delete_statement)
    # conn.commit()
    #     print(t[0])

    for table in tables:
        print_table(conn, table[0])
