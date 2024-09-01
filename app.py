from flask import Flask, render_template, jsonify, request
from sudoku import generate_sudoku, solve_sudoku
import os

app = Flask(__name__)

@app.route('/')
def index():
    puzzle, answer = generate_sudoku()
    return render_template('index.html', puzzle=puzzle, answer=answer)


@app.route('/solve', methods=['POST'])
def solve():
    user_board = request.json.get('board', [])
    answer = request.json.get('answer', [])
    
    if solve_sudoku(user_board, answer):
        return jsonify({'status': 'solved'})
    else:
        return jsonify({'status': 'incorrect'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
