import sqlite3


def solve_sudoku(values, answer):
    if values == answer:
        return True
    else:  
        return False
    

def get_db_connection():
    conn = sqlite3.connect('sudoku.db')
    return conn

def generate_sudoku():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT puzzle, solution FROM Sudokus ORDER BY RANDOM() LIMIT 1"
    cursor.execute(query)
    puzzle, solution = cursor.fetchone()
    conn.close()
    
    # Function to convert a string to a 2D list of integers
    def string_to_grid(sudoku_string):
        return [[int(sudoku_string[i * 9 + j]) for j in range(9)] for i in range(9)]
        
    # Convert problem and answer strings to grids
    sudoku_problem = string_to_grid(puzzle)
    sudoku_answer = string_to_grid(solution)
        
    return sudoku_problem, sudoku_answer

generate_sudoku()