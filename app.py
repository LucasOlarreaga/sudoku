from flask import Flask, render_template, jsonify, request, session
from sudoku import generate_sudoku, solve_sudoku
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'

@app.route('/')
def index():
    puzzle, answer = generate_sudoku()
    session['answer'] = answer  # Store the answer in the session
    session['puzzle'] = puzzle  # Store the answer in the session
    session['lives'] = 3  # Start with 3 lives
    return render_template('index.html', puzzle=puzzle, answer=answer)

@app.route('/check_number', methods=['POST'])
def check_number():
    if session.get('lives', 3) <= 0:
        return jsonify({'correct': False, 'lives': 0})

    data = request.json
    print(data)
    row = int(data.get('row', -1)) - 1 # Default to -1 if not provided
    col = int(data.get('col', -1)) - 1 # Default to -1 if not provided
    number_str = data.get('number', '')  # Get the number as a string

    if number_str == '':
        return jsonify({'correct': False, 'lives': session.get('lives', 3)})

    try:
        number = int(number_str)
    except ValueError:
        return jsonify({'correct': False, 'lives': session.get('lives', 3)})

    answer = session.get('answer', [])

    if not (0 <= row < len(answer) and 0 <= col < len(answer[row])):
        return jsonify({'correct': False, 'lives': session.get('lives', 3)})

    correct_number = answer[row][col]
    weird_number = answer[3][4]

    # Debug print statements
    print(f"User Input: row={row}, col={col}, number={number}")
    print(f"Correct Answer: {correct_number}")
    print(f"weird answer: {weird_number}\n")
    test_row, test_col = 3, 4
    print(type(answer))
    print(f"Value at row={test_row}, col={test_col}: {answer[test_row][test_col]}")

    print(f"\nFull puzzle answer is: {answer}")

    if correct_number == number:
        return jsonify({'correct': True})
    else:
        session['lives'] -= 1
        return jsonify({'correct': False, 'lives': session['lives']})
    
def get_row_col_indices(puzzle):
    indices = []
    for row_index, row in enumerate(puzzle):
        for col_index, _ in enumerate(row):
            indices.append((row_index, col_index))
    return indices

@app.context_processor
def utility_processor():
    return dict(get_row_col_indices=get_row_col_indices)






if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
