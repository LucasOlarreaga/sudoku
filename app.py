from flask import Flask, render_template, session, request, jsonify
from sudoku import generate_sudoku, get_row_col_indices, check_number, all_correct # import functions from sudoku.py
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
    try:
        puzzle, answer = generate_sudoku()
    except Exception as e:
        return jsonify({'error': str(e)})
    
    session['answer'] = answer  # Store the answer in the session
    session['puzzle'] = puzzle  # Store the answer in the session
    session['current_grid'] = puzzle
    session['filled_numbers'] = []

    for i in range (1,10):
        all_correct(i)
    return render_template('index.html', hints=session['hints'], lives=session['lives'], puzzle=session['puzzle'], answer=session['answer'])

@app.route('/check_number', methods=['POST'])
def check():
    return check_number(request=request, session=session)
    
@app.route('/get_current_grid', methods=['GET'])
def get_current_grid():
    return jsonify(session.get('current_grid', []))

@app.route('/update_current_grid', methods=['POST'])
def update_current_grid():
    data = request.json
    grid = data.get('grid', [])

    # Store the grid in the session
    session['current_grid'] = grid

    return jsonify({'success': True})


# Decorator runs before every template, meaking the returned dictionnary available
@app.context_processor
# This serves to give appropriate row and column values since some seemed to misalign
def utility_processor():
    return dict(get_row_col_indices=get_row_col_indices)

@app.route('/get_filled_numbers')
def get_filled_numbers():
    filled_numbers = session.get('filled_numbers', [])
    return jsonify({'filled_numbers': filled_numbers})

# Running app
if __name__ == '__main__':
    # Debug allows reloading app and detailed error message. Host IP address, allows to any device, network
    # Port set to whatever the os environment has (sets for Heroku), or default of 5000 (for local use)
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
