import sqlite3


# Solve sudoku if value equals answer
def solve_sudoku(values, answer):
    if values == answer:
        return True
    else:  
        return False
    

# Get DB and connect with SQLite
def get_db_connection():
    conn = sqlite3.connect('sudoku.db')
    return conn

# Generate Sudoku based on SQLite Connection
def generate_sudoku():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Asking for 1 random puzzle and its solution
    query = "SELECT puzzle, solution FROM Sudokus ORDER BY RANDOM() LIMIT 1"
    cursor.execute(query)
    puzzle, solution = cursor.fetchone()
    conn.close()
    
    # Function to convert a string to a 2D list of integers (for other code to not break)
    def string_to_grid(sudoku_string):
        return [[int(sudoku_string[i * 9 + j]) for j in range(9)] for i in range(9)]
        
    # Convert problem and answer strings to grids
    sudoku_problem = string_to_grid(puzzle)
    sudoku_answer = string_to_grid(solution)
        
    return sudoku_problem, sudoku_answer

# Getting the indices of each element in a puzzle (since this was causing issues)
def get_row_col_indices(puzzle):
    indices = []
    # Obtain the row indices of each element, and then the row itself
    for row_index, row in enumerate(puzzle):
        # Look at the rows obtained, and obtain the indice of the column of each element
        for col_index, _ in enumerate(row):
            # Add these indices of each element into an indice list
            indices.append((row_index, col_index))
    return indices
