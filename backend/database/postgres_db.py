import psycopg2

# 1. Use the full connection string
DB_URL = "postgresql://your_postgres_database_url"

def execute_query(query):
    """Connects to the database, executes a query, and fetches results if any."""
    conn = None
    try:
        # 2. Connect to your Vercel/Neon database
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 3. Execute the SQL command
        cur.execute(query)
        
        # 4. Check if the query returned results (e.g., SELECT statements)
        if cur.description:
            # Fetch column names
            column_names = [desc[0] for desc in cur.description]
            # Fetch all rows
            results = cur.fetchall()
            return column_names, results
        
        # 5. Commit changes for non-SELECT queries (like TRUNCATE, INSERT, DELETE)
        conn.commit()
        print(f"Query executed successfully. Rows affected: {cur.rowcount}")
        return None, None

    except psycopg2.Error as e:
        print(f"Database Error for query: '{query.strip()[:50]}...' -> {e}")
        if conn:
            conn.rollback() # Rollback in case of error
        return None, None
        
    finally:
        if conn:
            conn.close()

# Your Database Connection URL (already defined above, but repeated for clarity)
# DB_URL = "postgresql://neondb_owner:npg_gVRZa8obsI0O@ep-summer-dust-agddh9iv-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

def list_all_tables():
    """Connects to the database and lists all tables in the public schema."""
    conn = None
    try:
        print("Connecting to the database to list tables...")
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # SQL query to get all table names in the 'public' schema
        query = """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """
        
        cur.execute(query)
        
        # Fetch all results
        table_records = cur.fetchall()
        
        table_names = [record[0] for record in table_records]
        
        print("\n--- Database Tables Found ---")
        if table_names:
            for i, name in enumerate(table_names, 1):
                print(f"{i}. {name}")
        else:
            print("No tables found in the 'public' schema.")
        print("-----------------------------\n")
        
        return table_names

    except psycopg2.Error as e:
        print(f"Database Connection or Query Error: {e}")
        return []
        
    finally:
        if conn:
            conn.close()
            print("Table listing connection closed.")

# --- NEW FUNCTION TO SHOW ALL DATA ---
def show_all_table_data():
    """
    Lists all tables, then iterates through them to select and print
    all rows for each table.
    """
    table_names = list_all_tables()
    
    if not table_names:
        print("Cannot retrieve data because no tables were found.")
        return

    print("--- Fetching All Data from All Tables ---")
    
    for table_name in table_names:
        # Use a parameterized query or f-string for the table name for safety/readability
        # Note: psycopg2's 'execute' can only substitute values, not identifiers (like table/column names).
        # We must use f-strings or string formatting here, but since the table names come from the DB, it's safer.
        select_query = f'SELECT * FROM "{table_name}" ;' # Quoting table name in case it's a reserved word (like "user")
        
        column_names, table_data = execute_query(select_query)
        
        print(f"\n===== Table: {table_name.upper()} =====")
        
        if column_names is None:
            # Error occurred, already printed inside execute_query
            continue

        if column_names:
            print(f"Columns: {column_names}")
            
        if table_data:
            print(f"Total Rows: {len(table_data)}")
            print("Data:")
            for row in table_data:
                print(row)
        else:
            print("Table is empty (0 rows found).")
        
        print(f"================================\n")


# --- Main Execution ---
if __name__ == "__main__":
    # Call the new function to see all data
    show_all_table_data()

    # -----------------
    # Example Usage: Clear all data from the 'user' table
    # -----------------
    # print("Attempting to TRUNCATE 'user' table...")
    # truncate_query = "TRUNCATE TABLE \"user\" RESTART IDENTITY CASCADE;"
    # execute_query(truncate_query)

    # -----------------
    # Example Usage: Select all users from a specific table (e.g., 'COST')
    # -----------------
    # print("\nAttempting to SELECT from 'COST' table...")
    # select_query = "SELECT * FROM \"COST\" ;"
    # column_names, user_data = execute_query(select_query)

    # if user_data is not None:
    #     if user_data:
    #         print("\nFetched 'COST' Data:")
    #         print(f"Columns: {column_names}")
    #         for row in user_data:
    #             print(row)
    #     else:
    #         print("COST table is empty (0 rows found).")