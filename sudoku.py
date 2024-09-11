import sqlite3
from flask import Flask, render_template, jsonify, request, session


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

# Checking if number is the correct one and returning the appropriate json response
def check_number(request, session):
    if session.get('lives', 3) <= 0: # Checking if lives equal 0 or less (in case)
        return jsonify({'correct': False, 'lives': 0})

    data = request.json
    row = int(data.get('row', -1)) - 1 # Default to -1 if not provided
    col = int(data.get('col', -1)) - 1 # Default to -1 if not provided
    number_str = data.get('number', '')  # Get the number as a string

    # If empty returns nothing
    if number_str == '':
        # Return the previous amount of lives (aka no change, if empty default to 3)
        return jsonify({'correct': False, 'lives': session.get('lives', 3)})

    # If unable to convert string to int return nothing
    try:
        number = int(number_str)
    except ValueError:
        return jsonify({'correct': False, 'lives': session.get('lives', 3)})

    # Obtain answer from session data (if empty return [])
    answer = session.get('answer', [])
    

    # Ensuring answer we just got fits the dimensions of grid (or else return nothing)
    if not (0 <= row < len(answer) and 0 <= col < len(answer[row])):
        return jsonify({'correct': False, 'lives': session.get('lives', 3)})

    # Obtain the specific number in Xth row and Yth column (like input we are comparing)
    correct_number = answer[row][col]
    current_grid = session.get('current_grid', [])

    # Checking if input equals correct number
    if correct_number == number:
        current_grid[row][col] = number  # Update current_grid
        session['current_grid'] = current_grid  # Save updated grid
        return jsonify({'correct': True})
    else:
        # If not remove 1 life
        session['lives'] -= 1
        # Return the newly set amount of lives (no default value as backup)
        return jsonify({'correct': False, 'lives': session['lives']})
    

def all_correct(number):
    # Check if all instances of 'number' in the grid are correct
    grid = session.get('current_grid', [])
    n_correct_num = []
    for i, row in enumerate(grid):
        for j, cell in enumerate(row):
            if cell == number:
                n_correct_num.append(cell)
                if n_correct_num.length == 9:
                    print(f"\n Well Done you got all the {number}")
                    return True
    return False
