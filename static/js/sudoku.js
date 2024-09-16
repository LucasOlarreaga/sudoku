// Initialize lives variable
let lives = parseInt(document.querySelector("span#lives")?.textContent || "3", 10);
let hints = parseInt(document.querySelector("span#hints")?.textContent || "3", 10);

// Update lives and hearts
function updateLives(newLives) {
  console.log(newLives)
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
      number: value
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
        updateNumberButtons();
      } else {
        input.classList.add("incorrect");
        loseLife();
        console.log("test", lives)
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
          checkCompletion(); // Check if the puzzle is now complete
          updateNumberButtons();
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

let activeCell = null;

// Listen for clicks on the Sudoku cells
document.querySelectorAll("td input").forEach((cell) => {
  cell.addEventListener("focus", function () {
    activeCell = this;  // Set the currently focused cell as active
  });
});

// Listen for number button clicks
document.querySelectorAll(".number-button").forEach((button) => {
  button.addEventListener("click", function () {
    const number = this.getAttribute("data-value");
    if (activeCell) {
      activeCell.value = number;
      checkInput(activeCell);  // Call your checkInput function to verify the number
    }
  });
});

// Update the buttons based on filled numbers
function updateNumberButtons() {
  get_filled_numbers().then(filledNumbers => {
    document.querySelectorAll(".number-button").forEach((button) => {
      const value = parseInt(button.getAttribute("data-value"));
      if (filledNumbers.includes(value)) {
        button.classList.add("disabled");
        button.disabled = true;
      } else {
        button.classList.remove("disabled");
        button.disabled = false;
      }
    });
  });
}

// Call this function on page load and after each move to update buttons
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  updateNumberButtons();  // Update buttons for fully filled numbers
});


function get_filled_numbers() {
  return new Promise((resolve, reject) => {
    fetch("/get_filled_numbers")  // Assuming a route that returns filled_numbers
      .then(response => response.json())
      .then(data => {
        resolve(data.filled_numbers || []);  // Resolve with filled_numbers or an empty array
      })
      .catch(error => {
        reject(error);  // Reject the promise if there's an error
      });
  });
}

// Function to handle removing incorrect inputs
function removeIncorrectInputs() {
  document.querySelectorAll("td input").forEach((input) => {
    if (!input.disabled && input.value !== "") {
      // Remove value if input is not disabled and is incorrect
      input.value = "";
      input.classList.remove("incorrect"); // Optionally, remove the incorrect styling
    }
  });
}

// Add event listener to the Remove button
document.getElementById("remove-button").addEventListener("click", removeIncorrectInputs);


// Function to detect if the user is on a mobile device
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

// Function to remove highlights from all cells
function clearHighlights() {
  document.querySelectorAll('td').forEach(td => {
      td.classList.remove('highlighted');
  });
}

// Prevent keyboard input on mobile devices by adding `readonly`
function preventKeyboard() {
  if (isMobile()) {
      document.querySelectorAll("td").forEach((cell) => {
          const input = cell.querySelector("input");
          if (input) {
              // Set input to readonly to prevent keyboard pop-up
              input.setAttribute("readonly", "readonly");

              // Highlight the box when the td is clicked
              cell.addEventListener("click", function () {
                  clearHighlights(); // Clear any existing highlights
                  cell.classList.add('highlighted'); // Highlight this cell
                  setTimeout(() => input.blur(), 0); // Blur the input to immediately hide keyboard
              });
          }
      });
  }
}

// Handle value input from number buttons
function handleNumberButtonClicks() {
  document.querySelectorAll(".number-button").forEach((button) => {
      button.addEventListener("click", function () {
          const value = this.getAttribute("data-value");
          const highlightedCell = document.querySelector('td.highlighted');
          if (highlightedCell) {
              const input = highlightedCell.querySelector("input");
              if (input) {
                  // Set the value and dispatch an input event
                  input.value = value; // Set value when the button is clicked
                  input.dispatchEvent(new Event('input')); // Dispatch input event if needed
                  // Highlights will be cleared in clearHighlights() after input
                  clearHighlights(); // Optionally clear highlights here
              }
          }
      });
  });
}

// Handle the remove button to clear highlighted cells
document.getElementById("remove-button").addEventListener("click", function () {
  const highlightedCell = document.querySelector('td.highlighted');
  if (highlightedCell) {
      const input = highlightedCell.querySelector("input");
      if (input) {
          input.value = ""; // Clear the input value
          clearHighlights(); // Clear highlights
      }
  }
});

// Call this function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  preventKeyboard(); // Call the preventKeyboard function
  handleNumberButtonClicks(); // Setup button handlers
});