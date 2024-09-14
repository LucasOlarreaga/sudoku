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
        updateCurrentGrid();  // Update grid after correct input
        checkCompletion();
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.disabled = true;
        updateNumberMarkers();  // Update number markers
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

  // Gather the current board state
  document.querySelectorAll("tr").forEach((row, i) => {
    let rowArr = [];
    row.querySelectorAll("td").forEach((cell, j) => {
      let value = cell.querySelector("input") ? cell.querySelector("input").value : cell.textContent;
      rowArr.push(value === "" ? 0 : parseInt(value));
    });
    board.push(rowArr);
  });

  // Find all empty cells on the board
  let emptyCells = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }

  // If there are empty cells and hints are available
  if (emptyCells.length > 0 && hints > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const row = randomCell.row;
    const col = randomCell.col;
    const cell = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`);

    // Reveal the correct number
    const correctNumber = answer[row][col];
    cell.value = correctNumber;
    cell.disabled = true;  // Disable the input after revealing the correct number

    // Make an API call to check_number to validate the revealed number
    fetch("/check_number", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        row: row + 1,  // Send 1-based row and col indices to the backend
        col: col + 1,
        number: correctNumber
      }),
    })
    .then(response => response.json())
    .then(data => {
        // Update the grid after the correct input
        updateCurrentGrid().then(() => {
          updateNumberMarkers();  // Update the number markers based on the correct input
          checkCompletion();  // Check if the puzzle is now complete
        });
    })
    .catch(error => {
      console.error("Error checking the revealed number:", error);
    });

    // Use a hint
    useHint();
  } else {
    console.error('No empty cells or hints exhausted');
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

function updateCurrentGrid() {
  return new Promise((resolve) => {
  const currentGrid = [];

  document.querySelectorAll("tr").forEach((row, i) => {
    const rowArr = [];
    row.querySelectorAll("td").forEach((cell, j) => {
      const input = cell.querySelector("input");
      rowArr.push(input ? parseInt(input.value) || 0 : parseInt(cell.textContent) || 0);
    });
    currentGrid.push(rowArr);
  });

  // Send updated grid to the server
  fetch("/update_current_grid", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grid: currentGrid }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log("Current grid updated successfully.");
    } else {
      console.error("Failed to update current grid.");
    }
    resolve();  // Resolve the promise here
         });
  });
}

function updateNumberMarkers() {
  const numbersContainer = document.getElementById("numbers-container");
  numbersContainer.innerHTML = '';  // Clear previous markers

  fetch("/get_filled_numbers")  // Assuming a route that returns filled_numbers
    .then(response => response.json())
    .then(data => {
      const filledNumbers = data.filled_numbers;
      if (filledNumbers.length != 0){
        for (let i = 1; i <= 9; i++) {
          const numberElement = document.createElement("div");
          numberElement.className = "number";
          numberElement.textContent = i;

          if (filledNumbers.includes(i)) {
            numberElement.style.visibility = "visible";
          } else {
            numberElement.style.visibility = "hidden";
          }

          numbersContainer.appendChild(numberElement);
        }
    }
    });
}

