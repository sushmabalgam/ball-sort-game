const colors = ['red', 'blue', 'green', 'yellow'];
const conesContainer = document.getElementById('cones-container');
const resetButton = document.getElementById('reset-button');

let cones = [];
let level = 1; // Start at level 1

// Function to generate random bright hex colors with names
function generateNamedColor(index) {
    const colorHex = generateBrightColor();
    const colorName = `color-${index}`; // Assign a unique name based on the index
    return { name: colorName, hex: colorHex };
}

// Function to generate bright hex colors
function generateBrightColor() {
    let color;
    do {
        color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    } while (!isBrightColor(color));
    return color;
}

// Function to check if a color is bright
function isBrightColor(hexColor) {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
}

// Function to update the level display
function updateLevelDisplay() {
    const levelDisplay = document.getElementById('level-display');
    levelDisplay.textContent = `Level: ${level}`;
}

// Function to ask for the user's name
function askUserName() {
    let userName = localStorage.getItem('userName');
    if (!userName) {
        userName = prompt('Please enter your name:');
        if (userName) {
            localStorage.setItem('userName', userName);
        }
    }
    document.getElementById('user-name-display').textContent = `Player: ${userName || 'Guest'}`;
}

// Function to persist game data
function persistGameData() {
    const gameData = {
        level,
        cones,
    };
    localStorage.setItem('gameData', JSON.stringify(gameData));
}

// Function to load game data
function loadGameData() {
    const gameData = JSON.parse(localStorage.getItem('gameData'));
    if (gameData) {
        level = gameData.level || 1;
        cones = gameData.cones || [];
    }
}

// Add event listener to change user
document.getElementById('change-user-button').addEventListener('click', () => {
    localStorage.removeItem('userName');
    askUserName();
    initGame();
});

// Initialize the game
function initGame() {
    conesContainer.innerHTML = '';
    cones = [];
    // askUserName(); // Ensure user info is displayed
    updateLevelDisplay(); // Update level display

    // Dynamically generate more colors if the level exceeds the predefined colors
    while (colors.length < level + 2) {
        const { name, hex } = generateNamedColor(colors.length + 1);
        colors.push(name);

        // Add the color to the stylesheet dynamically
        const style = document.createElement('style');
        style.innerHTML = `
            .ball.${name} {
                background-color: ${hex};
            }
        `;
        document.head.appendChild(style);
    }

    const levelColors = colors.slice(0, level + 2); // Dynamically adjust colors based on level
    const totalCones = 4 + level; // Increase cones with level
    const filledCones = totalCones - 2; // Keep 2 cones empty

    // Create cones
    for (let i = 0; i < totalCones; i++) {
        const cone = document.createElement('div');
        cone.classList.add('cone');
        cone.dataset.index = i;
        cones.push([]);
        conesContainer.appendChild(cone);
    }

    // Generate balls
    const balls = [];
    for (let i = 0; i < 4; i++) {
        levelColors.forEach(color => balls.push(color));
    }

    // Shuffle the balls
    shuffleArray(balls);

    // Distribute shuffled balls into the filled cones
    let ballIndex = 0;
    for (let i = 0; i < filledCones; i++) {
        const coneElement = document.querySelector(`.cone[data-index="${i}"]`);
        for (let j = 0; j < 4; j++) {
            const ball = document.createElement('div');
            const ballColor = balls[ballIndex];
            ball.classList.add('ball', ballColor);
            ball.draggable = true;
            ball.dataset.color = ballColor;
            ball.style.cursor = 'grab';
            ball.addEventListener('dragstart', onDragStart);
            coneElement.appendChild(ball);
            cones[i].push(ballColor);
            ballIndex++;
        }
    }
    // The last 2 cones remain empty

    persistGameData(); // Save game data
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Drag-and-drop handlers for desktop and touch events
let draggedBall = null;

function onDragStart(event) {
    draggedBall = event.target;
    draggedBall.style.cursor = 'grabbing'; // Change cursor to grabbing
    console.log(`Drag started: Ball color = ${draggedBall.dataset.color}`);
}

// Handle touch start for mobile
function onTouchStart(event) {
    const touch = event.touches[0];
    draggedBall = event.target;
    draggedBall.style.cursor = 'grabbing';
    console.log(`Touch started: Ball color = ${draggedBall.dataset.color}`);
    event.preventDefault();
}

// Handle touch move for mobile
function onTouchMove(event) {
    event.preventDefault();
}

// Handle touch end for mobile
function onTouchEnd(event) {
    const targetCone = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)?.closest('.cone');
    if (targetCone && draggedBall) {
        const targetIndex = parseInt(targetCone.dataset.index, 10);
        const sourceIndex = parseInt(draggedBall.parentElement.dataset.index, 10);

        console.log(`Touch drop event: Source cone = ${sourceIndex}, Target cone = ${targetIndex}`);

        // Prevent dragging to the same cone
        if (sourceIndex === targetIndex) {
            console.log('Cannot drop in the same cone');
            draggedBall = null;
            return;
        }

        const ballColor = draggedBall.dataset.color;
        const sourceCone = cones[sourceIndex];
        const targetConeArray = cones[targetIndex];

        // Check if the target cone is empty or has the same color at the top
        if (
            targetConeArray.length === 0 ||
            targetConeArray[targetConeArray.length - 1] === ballColor
        ) {
            console.log(`Valid move: Moving balls of color ${ballColor}`);

            // Remove the top ball from the source cone
            const removedBallColor = sourceCone.pop();
            if (removedBallColor !== ballColor) {
                console.error('Mismatch between dragged ball and source cone top ball');
                draggedBall = null;
                return;
            }

            // Ensure the target cone has enough space
            if (targetConeArray.length + 1 <= 8) {
                // Add the ball to the target cone
                targetConeArray.push(ballColor);

                // Move the ball element to the target cone
                targetCone.appendChild(draggedBall);

                // Add transition effect
                draggedBall.style.transition = "transform 0.3s ease";

                // Play drop sound
                const dropSound = new Audio('assets/dropplet.mp3');
                dropSound.play();

                console.log(`Ball moved successfully to cone ${targetIndex}`);
                draggedBall = null;

                checkWinCondition();
            } else {
                console.log('Not enough space in the target cone');
                // Return the ball to the source cone if there's not enough space
                sourceCone.push(ballColor);
            }
        } else {
            console.log('Invalid move: Target cone does not match color or is full');
            draggedBall = null; // Reset draggedBall if the move is invalid
        }
    }
}

// Add touch event listeners for mobile
conesContainer.addEventListener('touchstart', event => {
    if (event.target.classList.contains('ball')) {
        onTouchStart(event);
    }
});

conesContainer.addEventListener('touchmove', onTouchMove);

conesContainer.addEventListener('touchend', onTouchEnd);

conesContainer.addEventListener('dragend', () => {
    if (draggedBall) {
        draggedBall.style.cursor = 'grab'; // Reset cursor to grab after dragging
        draggedBall = null;
    }
});

conesContainer.addEventListener('dragover', event => {
    event.preventDefault();
});

conesContainer.addEventListener('drop', event => {
    const targetCone = event.target.closest('.cone');
    if (targetCone && draggedBall) {
        const targetIndex = parseInt(targetCone.dataset.index, 10);
        const sourceIndex = parseInt(draggedBall.parentElement.dataset.index, 10);

        console.log(`Drop event: Source cone = ${sourceIndex}, Target cone = ${targetIndex}`);

        // Prevent dragging to the same cone
        if (sourceIndex === targetIndex) {
            console.log('Cannot drop in the same cone');
            draggedBall = null;
            return;
        }

        const ballColor = draggedBall.dataset.color;
        const sourceCone = cones[sourceIndex];
        const targetConeArray = cones[targetIndex];

        // Check if the target cone is empty or has the same color at the top
        if (
            targetConeArray.length === 0 ||
            targetConeArray[targetConeArray.length - 1] === ballColor
        ) {
            console.log(`Valid move: Moving balls of color ${ballColor}`);

            // Remove the top ball from the source cone
            const removedBallColor = sourceCone.pop();
            if (removedBallColor !== ballColor) {
                console.error('Mismatch between dragged ball and source cone top ball');
                const cheeringSound = new Audio('assets/wrong.mp3'); // Ensure the file exists in the specified path
                cheeringSound.play();
                draggedBall = null;
                return;
            }

            // Ensure the target cone has enough space
            if (targetConeArray.length + 1 <= 8) {
                // Add the ball to the target cone
                targetConeArray.push(ballColor);

                // Move the ball element to the target cone
                targetCone.appendChild(draggedBall);

                // Add transition effect
                draggedBall.style.transition = "transform 0.3s ease";

                // Play drop sound
                const dropSound = new Audio('assets/dropplet.mp3');
                dropSound.play();

                console.log(`Ball moved successfully to cone ${targetIndex}`);
                draggedBall = null;

                checkWinCondition();
            } else {
                console.log('Not enough space in the target cone');
                // Return the ball to the source cone if there's not enough space
                sourceCone.push(ballColor);
            }
        } else {
            console.log('Invalid move: Target cone does not match color or is full');
            // Play cheering sound
            const cheeringSound = new Audio('assets/wrong.mp3'); // Ensure the file exists in the specified path
            cheeringSound.play();
            draggedBall = null; // Reset draggedBall if the move is invalid
        }
    }
});

// Function to trigger celebration for a completed cone
function celebrateConeCompletion(coneIndex) {
    console.log(`Celebration: Cone ${coneIndex} completed!`);
    const coneElement = document.querySelector(`.cone[data-index="${coneIndex}"]`);
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    coneElement.appendChild(confetti);

    // Remove confetti after animation ends
    confetti.addEventListener('animationend', () => {
        confetti.remove();
    });
}

// Function to trigger full-screen celebration on win
function celebrateWin() {
    console.log('Celebration: Full-screen win!');

    // Play cheering sound
    const cheeringSound = new Audio('assets/wow.mp3'); // Ensure the file exists in the specified path
    cheeringSound.play();

    const celebrationOverlay = document.createElement('div');
    celebrationOverlay.id = 'celebration-overlay';
    celebrationOverlay.innerHTML = `
        <div class="celebration-message">🎉Congratulations!! You Won! 🎉</div>
    `;
    document.body.appendChild(celebrationOverlay);

    setTimeout(() => {
        celebrationOverlay.remove();
    }, 3000); // Remove overlay after 3 seconds
}

// Check if the player has won
function checkWinCondition() {
    const filledCones = cones.filter(cone => cone.length === 4 && new Set(cone).size === 1);
    const emptyCones = cones.filter(cone => cone.length === 0);

    console.log(`Checking win condition: Filled cones = ${filledCones.length}, Empty cones = ${emptyCones.length}`);

    // Trigger celebration for each completed cone
    cones.forEach((cone, index) => {
        if (cone.length === 4 && new Set(cone).size === 1) {
            celebrateConeCompletion(index);
        }
    });

    // Win condition: All filled cones have balls of the same color, 2 cones empty
    if (filledCones.length === cones.length - 2 && emptyCones.length === 2) {
        celebrateWin();
        level++; // Increase level
        setTimeout(initGame, 2000); // Start the next level after 2 seconds
    }
}

// Check if all cones are full
function areAllConesFull() {
    const cones = document.querySelectorAll('.cone'); // Assuming cones have the class 'cone'
    const maxBallsPerCone = 8; // Replace with the actual maximum number of balls per cone

    return Array.from(cones).every(cone => {
        const balls = cone.querySelectorAll('.ball'); // Assuming balls have the class 'ball'
        return balls.length === maxBallsPerCone;
    });
}

// Example usage:
if (areAllConesFull()) {
    console.log("All cones are full!");
} else {
    console.log("There are still empty cones.");
}

// Reset the game
resetButton.addEventListener('click', initGame);

// Load game data on page load
window.addEventListener('load', () => {
    loadGameData();
    initGame();
});