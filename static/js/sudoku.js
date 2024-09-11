// Initialize lives variable
let lives = parseInt(document.querySelector("span#lives")?.textContent || "3", 10);
let hints = parseInt(document.querySelector("span#hints")?.textContent || "3", 10);

// Update lives and hearts
function updateLives(newLives) {
  lives = newLives;
  const hearts = Array.from(document.querySelectorAll(".life")).reverse();

  hearts.forEach((heart, index) => {
    if (index < lives) {
      heart.classList.remove("used");
    } else {
      heart.classList.add("used");
    }
  });

  if (lives <= 0) {
    document.getElementById("message").textContent = "Game Over! You've lost all your lives.";
    document.getElementById("message").style.color = "red";
    disableAllInputs();
  }
}

function loseLife() {
  updateLives(lives - 1);
}

document.addEventListener("DOMContentLoaded", () => {
  updateLives(lives);
});

function checkInput(input) {
  const value = input.value;
  const row = input.getAttribute("data-row");
  const col = input.getAttribute("data-col");

  if (value && (value < 1 || value > 9)) {
    input.value = "";
    return;
  }

  if (!value) {
    input.classList.remove("incorrect");
    return;
  }

  fetch("/check_number", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      row: row,
      col: col,
      number: value,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.correct) {
        input.classList.remove("incorrect");
        checkCompletion();
      } else {
        input.classList.add("incorrect");
        updateLives(data.lives);
      }
    });
}

function checkCompletion() {
  let board = [];
  document.querySelectorAll("tr").forEach((row, i) => {
    let rowArr = [];
    row.querySelectorAll("td").forEach((cell, j) => {
      let value = cell.querySelector("input") ? cell.querySelector("input").value : cell.textContent;
      rowArr.push(value === "" ? 0 : parseInt(value));
    });
    board.push(rowArr);
  });

  const answer = JSON.parse(document.getElementById("answer").value);

  const isCompleted = board.every((row, i) =>
    row.every((cell, j) => cell === answer[i][j])
  );

  if (isCompleted) {
    document.getElementById("message").textContent = "Well Done! You've solved the Sudoku!";
    document.getElementById("message").style.color = "green";
    disableAllInputs();
  }
}

function disableAllInputs() {
  document.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });
}

function newPuzzle() {
  location.reload();
}

function revealNumber() {
  const answer = JSON.parse(document.getElementById("answer").value);
  let board = [];

  document.querySelectorAll("tr").forEach((row, i) => {
    let rowArr = [];
    row.querySelectorAll("td").forEach((cell, j) => {
      let value = cell.querySelector("input") ? cell.querySelector("input").value : cell.textContent;
      rowArr.push(value === "" ? 0 : parseInt(value));
    });
    board.push(rowArr);
  });

  let emptyCells = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }

  if (emptyCells.length > 0 && hints > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const row = randomCell.row + 1;
    const col = randomCell.col + 1;
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    cell.value = answer[randomCell.row][randomCell.col];
    cell.disabled = true;

    useHint();
    checkCompletion();
  }
}

function useHint() {
  hints -= 1;
  const hintIcons = Array.from(document.querySelectorAll(".hint")).reverse();

  hintIcons.forEach((icon, index) => {
    if (index < hints) {
      icon.classList.remove("used");
    } else {
      icon.classList.add("used");
    }
  });

  if (hints === 0) {
    document.getElementById("message").textContent = "No more hints available!";
    document.getElementById("message").style.color = "orange";
  }
}
