// Initialize lives and hints variables
let lives = parseInt(document.querySelector("span#lives")?.textContent || "3", 10);
let hints = parseInt(document.querySelector("span#hints")?.textContent || "3", 10);


// Function to update lives and the display of hearts
function updateLives(newLives) {
  lives = newLives; // Set current lives to new value
  const hearts = Array.from(document.querySelectorAll(".life")); // Get the heart elements

  // Update each heart's display based on remaining lives
  hearts.forEach((heart, index) => {
    heart.classList.toggle("used", index >= lives); // Toggle visibility based on lives
  });

  // If no lives are left, display a game over message and disable inputs
  if (lives <= 0) {
    displayMessage("Game Over! You've lost all your lives.", "red");
    disableAllInputs(); // Call function to disable all inputs
  }
}

// Function to reduce the lives by one when a life is lost
function loseLife() {
  updateLives(lives - 1); // Call updateLives with decreased lives
}

// Function to check the input value of the Sudoku cell
function checkInput(input) {
  const value = input.value; // Get current input value
  const row = input.getAttribute("data-row"); // Get row index from data attribute
  const col = input.getAttribute("data-col"); // Get column index from data attribute

  // If the value is out of valid range (1-9), clear the input
  if (value && (value < 1 || value > 9)) {
    input.value = "";
    return;
  }

  // If no value is input, remove incorrect styling
  if (!value) {
    input.classList.remove("incorrect");
    return;
  }

  // Make a POST request to check the input number
  fetch("/check_number", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ row, col, number: value }),
  })
    .then((response) => response.json()) // Parse the JSON response
    .then((data) => {
      if (data.correct) { // If the input is correct
        input.classList.remove("incorrect"); // Remove incorrect styling
        updateCurrentGrid() // Update grid after correct input
          .then(checkCompletion); // Check if puzzle is completed

        // Disable the current cell input after correct entry
        input.disabled = true; // Disable input directly without querying the cell
        updateNumberButtons(); // Update the number buttons based on current grid
      } else { // If the input is incorrect
        input.classList.add("incorrect"); // Add incorrect styling
        loseLife(); // Call loseLife function to decrease lives
      }
    })
    .catch(err => console.error("Error checking input:", err)); // Log any fetch errors
}

// Function to check if the Sudoku puzzle is complete
function checkCompletion() {
  const board = Array.from(document.querySelectorAll("tr")).map(row => 
    Array.from(row.querySelectorAll("td")).map(cell => {
      const input = cell.querySelector("input");
      return input ? (parseInt(input.value) || 0) : (parseInt(cell.textContent) || 0);
    })
  );

  // Get the correct answer from the hidden input element
  const answer = JSON.parse(document.getElementById("answer").value);

  // Check if every cell matches the correct answer
  const isCompleted = board.every((row, i) => row.every((cell, j) => cell === answer[i][j]));

  // If the puzzle is complete, notify the user
  if (isCompleted) {
      stopTimer();  // Stop the timer when the puzzle is solved
      showCompletionMessage();  // Display the final message
      disableAllInputs(); // Call function to disable all inputs
  }
}

// Function to display message on the UI
function displayMessage(text, color) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = text;
  messageElement.style.color = color; // Set message color
}

// Function to disable all input fields in the puzzle
function disableAllInputs() {
  document.querySelectorAll("input").forEach(input => (input.disabled = true)); // Disable each input element
}

// Function to reset the game and start a new puzzle
function newPuzzle() {
  location.reload(); // Reload the page
}

// Function to reveal a number as a hint
function revealNumber() {
  const answer = JSON.parse(document.getElementById("answer").value); // Get the correct answer
  let board = [];

  // Gather the current board state
  document.querySelectorAll("tr").forEach((row) => {
    let rowArr = [];
    row.querySelectorAll("td").forEach((cell) => {
      let value = cell.querySelector("input") ? cell.querySelector("input").value : cell.textContent;
      rowArr.push(value === "" ? 0 : parseInt(value));
    });
    board.push(rowArr); // Add the row to the board
  });

  // Find all empty cells on the board
  let emptyCells = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({ row: i, col: j }); // Store coordinates of empty cells
      }
    }
  }

  // If there are empty cells and hints are available
  if (emptyCells.length > 0 && hints > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]; // Select a random empty cell
    const row = randomCell.row;
    const col = randomCell.col;
    const cell = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`);

    // Reveal the correct number in the selected cell
    const correctNumber = answer[row][col];
    cell.value = correctNumber;
    cell.disabled = true;  // Disable input for this cell after revealing

    // Make an API call to check the revealed number
    fetch("/check_number", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        row: row + 1, // Send 1-based indices to the backend
        col: col + 1,
        number: correctNumber
      }),
    })
    .then(response => response.json())
    .then(data => {
      // Update the grid after the correct input
      updateCurrentGrid().then(() => {
        checkCompletion(); // Check if the puzzle is now complete
        updateNumberButtons(); // Update numbers on the buttons
      });
    })
    .catch(error => {
      console.error("Error checking the revealed number:", error); // Log any errors
    });

    // Use a hint
    useHint(); // Call useHint function to decrease hint count
  } else {
    console.error('No empty cells or hints exhausted'); // Log if no hints are available
  }
}

// Function to decrement hints and update hint display
function useHint() {
  hints -= 1; // Decrease hint count
  const hintIcons = Array.from(document.querySelectorAll(".hint")).reverse();

  // Update each hint icon based on remaining hints
  hintIcons.forEach((icon, index) => {
    icon.classList.toggle("used", index >= hints); // Toggle visibility based on hints
  });

  // Alert the user if no hints are left
  if (hints === 0) {
    displayMessage("No more hints available!", "orange"); // Notify user
  }
}

// Function to update the current grid state on the server
function updateCurrentGrid() {
  return new Promise((resolve) => {
    const currentGrid = Array.from(document.querySelectorAll("tr")).map(row => 
      Array.from(row.querySelectorAll("td")).map(cell => {
        const input = cell.querySelector("input");
        return input ? (parseInt(input.value) || 0) : (parseInt(cell.textContent) || 0);
      })
    );

    // Send the updated grid state to the server
    fetch("/update_current_grid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grid: currentGrid }), // Convert grid to JSON
    })
      .then(response => response.json()) // Parse JSON response
      .then(data => {
        if (data.success) {
          console.log("Current grid updated successfully."); // Log success
        } else {
          console.error("Failed to update current grid."); // Log error
        }
        resolve(); // Resolve the promise
      });
  });
}

// Function to manage the clicks on Sudoku cells
let activeCell = null;

// Listen for clicks on the Sudoku cells and set the active cell
document.querySelectorAll("td input").forEach((cell) => {
  cell.addEventListener("focus", function () {
    activeCell = this; // Set the currently focused cell as active
  });
});

// Listen for number button clicks and set the current cell's value
document.querySelectorAll(".number-button").forEach((button) => {
  button.addEventListener("click", function () {
    const number = this.getAttribute("data-value");
    if (activeCell) {
      activeCell.value = number; // Set the value in the active cell
      checkInput(activeCell);  // Call checkInput to verify the number
    }
  });
});

// Update the buttons based on filled numbers
function updateNumberButtons() {
  get_filled_numbers().then(filledNumbers => {
    document.querySelectorAll(".number-button").forEach((button) => {
      const value = parseInt(button.getAttribute("data-value"));
      button.disabled = filledNumbers.includes(value); // Disable if already filled
      button.classList.toggle("disabled", button.disabled); // Toggle disabled class
    });
  });
}

// Call this function on page load and after each move to update buttons
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  updateNumberButtons();  // Update buttons for fully filled numbers
});

// Function to get filled numbers from the server
function get_filled_numbers() {
  return new Promise((resolve, reject) => {
    fetch("/get_filled_numbers")  // Assuming a route that returns filled numbers
      .then(response => response.json())
      .then(data => {
        resolve(data.filled_numbers || []);  // Resolve with filled_numbers or an empty array
      })
      .catch(error => {
        console.error("Error fetching filled numbers:", error); // Log fetch errors
        reject(error);  // Reject the promise if there's an error
      });
  });
}

// Function to handle removing incorrect inputs
function removeIncorrectInputs() {
  document.querySelectorAll("td input").forEach((input) => {
    if (!input.disabled && input.value !== "") {
      input.value = ""; // Clear value if input is not disabled
      input.classList.remove("incorrect"); // Optionally, remove the incorrect styling
    }
  });
}

// Add event listener to the Remove button
document.getElementById("remove-button").addEventListener("click", removeIncorrectInputs);

// Function to detect if the user is on a mobile device
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent); // Regex to check for mobile user agent
}

// Function to remove highlights from all cells
function clearHighlights() {
  document.querySelectorAll('td').forEach(td => {
    td.classList.remove('highlighted'); // Remove highlight class from each cell
  });
}

// Prevent keyboard input on mobile devices by adding readonly
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
          setTimeout(() => input.blur(), 0); // Blur the input to hide keyboard
        });
      }
    });
  }
}

// Call this function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  preventKeyboard(); // Call the preventKeyboard function
});

document.addEventListener('DOMContentLoaded', (event) => {
  startTimer();
});

let timerInterval;  // Store the interval globally
let finalTime;      // Store the final time

function startTimer() {
    let startTime = Date.now();

    timerInterval = setInterval(() => {
        let elapsedTime = Date.now() - startTime;
        let minutes = Math.floor(elapsedTime / 60000);
        let seconds = Math.floor((elapsedTime % 60000) / 1000);

        // Add leading zeros to keep the format 00:00
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        finalTime = minutes + ":" + seconds;
        document.getElementById('timer').textContent = finalTime;
    }, 1000);  // Update the timer every second
}

function stopTimer() {
    clearInterval(timerInterval);  // Stop the timer
}

function showCompletionMessage() {
  let hintsUsed = 3 - hints;
  let mistakes = 3 - lives;
  let message = "Congratulations! You solved the puzzle in " + finalTime + ",<br>" +
                "using " + hintsUsed + " hint(s), and made " + mistakes + " mistake(s)!";
  let messageElement = document.getElementById('message');

  // Update the message element with the final time and hints used
  messageElement.innerHTML = message;

  // Style the message as needed
  messageElement.style.color = 'green';
  messageElement.style.textAlign = 'center';
  messageElement.style.fontSize = '20px';
  messageElement.style.borderRadius = '10px';
}

