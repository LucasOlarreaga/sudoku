from flask import Flask, render_template, jsonify, request, session
from sudoku import generate_sudoku, get_row_col_indices # import functions from sudoku.py
from dotenv import load_dotenv
import os


# Initiate app
app = Flask(__name__)

# Load environment and set secret key (necessary to store session data)
load_dotenv()
app.secret_key = os.getenv('SECRET_KEY', 'fallback_key')

# Base route which generates sudoku, and sets variables
@app.route('/')
def index():
    puzzle, answer = generate_sudoku()
    session['answer'] = answer  # Store the answer in the session
    session['puzzle'] = puzzle  # Store the answer in the session
    session['lives'] = 3  # Start with 3 lives
    session['hints'] = 3  # Start with 3 hints
    return render_template('index.html', hints=session['hints'], lives=session['lives'], puzzle=session['puzzle'], answer=session['answer'])


@app.route('/check_number', methods=['POST'])
def check_number():
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

    # Checking if input equals correct number
    if correct_number == number:
        return jsonify({'correct': True})
    else:
        # If not remove 1 life
        session['lives'] -= 1
        # Return the newly set amount of lives (no default value as backup)
        return jsonify({'correct': False, 'lives': session['lives']})

# Decorator runs before every template, meaking the returned dictionnary available
@app.context_processor
# This serves to give appropriate row and column values since some seemed to misalign
def utility_processor():
    return dict(get_row_col_indices=get_row_col_indices)


# Running app
if __name__ == '__main__':
    # Debug allows reloading app and detailed error message. Host IP address, allows to any device, network
    # Port set to whatever the os environment has (sets for Heroku), or default of 5000 (for local use)
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
