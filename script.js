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
        color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    } while (!isBrightColor(color) || isColorTooSimilar(color));
    return color;
}

// Function to check if a color is too similar to existing colors
function isColorTooSimilar(newColor) {
    const newRgb = hexToRgb(newColor);
    return colors.some(existingColor => {
        const existingRgb = hexToRgb(existingColor);
        return colorDistance(newRgb, existingRgb) < 100; // Threshold for similarity
    });
}

// Function to convert hex color to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Function to calculate the distance between two colors
function colorDistance(rgb1, rgb2) {
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
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
            ball.dataset.color = ballColor; // Set the data-color attribute for tooltip
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
let lineElement = null;
let pathElement = null;

// Modify the onDragStart function to create an SVG path element
function onDragStart(event) {
    const ball = event.target;
    const parentCone = ball.parentElement;
    const coneIndex = parseInt(parentCone.dataset.index, 10);

    // Allow dragging only if the ball is the top ball in the cone
    if (cones[coneIndex].length > 0 && cones[coneIndex][cones[coneIndex].length - 1] === ball.dataset.color) {
        draggedBall = ball;
        draggedBall.style.cursor = 'grabbing'; // Change cursor to grabbing
        console.log(`Drag started: Ball color = ${draggedBall.dataset.color}`);

        // Create an SVG path element for the curvy line
        pathElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        pathElement.classList.add('curvy-line');
        pathElement.innerHTML = `<path d="" stroke="url(#gradient)" fill="none" stroke-width="4" />`;
        document.body.appendChild(pathElement);
    } else {
        event.preventDefault(); // Prevent dragging if it's not the top ball
        console.log('Only the top ball can be dragged.');
    }
}

// Handle touch start for mobile
function onTouchStart(event) {
    const touch = event.touches[0];
    const ball = event.target;
    const parentCone = ball.parentElement;
    const coneIndex = parseInt(parentCone.dataset.index, 10);

    // Allow dragging only if the ball is the top ball in the cone
    if (cones[coneIndex].length > 0 && cones[coneIndex][cones[coneIndex].length - 1] === ball.dataset.color) {
        draggedBall = ball;
        draggedBall.style.cursor = 'grabbing';
        console.log(`Touch started: Ball color = ${draggedBall.dataset.color}`);
    } else {
        event.preventDefault(); // Prevent dragging if it's not the top ball
        console.log('Only the top ball can be dragged.');
    }
}

// Handle touch move for mobile
function onTouchMove(event) {
    event.preventDefault();
}

let droppletSound;
function initDragAudio() {
    droppletSound = new Audio('assets/dropplet.mp3');
    droppletSound.load(); // Preload
}
// Call this once, in a user interaction (e.g., touchstart or click)
document.addEventListener('touchstart', initDragAudio, { once: true });
document.addEventListener('click', initDragAudio, { once: true });


let wrongSound;
function initWrongAudio() {
    wrongSound = new Audio('assets/wrong.mp3');
    wrongSound.load(); // Preload
}
// Call this once, in a user interaction (e.g., touchstart or click)
document.addEventListener('touchstart', initWrongAudio, { once: true });
document.addEventListener('click', initWrongAudio, { once: true });

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
            targetConeArray.length < 4 && // Ensure the target cone has space for the ball
            (targetConeArray.length === 0 || targetConeArray[targetConeArray.length - 1] === ballColor)
        ) {
            console.log(`Valid move: Moving balls of color ${ballColor}`);

            // Remove the top ball from the source cone
            const removedBallColor = sourceCone.pop();
            if (removedBallColor !== ballColor) {
                console.error('Mismatch between dragged ball and source cone top ball');
                draggedBall = null;
                return;
            }

            // Add the ball to the target cone
            targetConeArray.push(ballColor);

            // Move the ball element to the target cone
            targetCone.appendChild(draggedBall);

            // Add transition effect
            draggedBall.style.transition = "transform 0.3s ease";

            // Play drop sound
            // const dropSound = new Audio('assets/dropplet.mp3'); dropSound.play();
            if (droppletSound) {
                droppletSound.currentTime = 0;
                droppletSound.play().catch(err => console.warn('Audio play failed:', err));
            }

            console.log(`Ball moved successfully to cone ${targetIndex}`);
            draggedBall = null;

            checkWinCondition();
        } else {
            if (wrongSound) {
                wrongSound.currentTime = 0;
                wrongSound.play().catch(err => console.warn('Audio play failed:', err));
            }
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
    if (lineElement) {
        lineElement.remove();
        lineElement = null;
    }
    if (pathElement) {
        pathElement.remove();
        pathElement = null;
    }
    if (draggedBall) {
        draggedBall.style.cursor = 'grab'; // Reset cursor to grab after dragging
        draggedBall = null;
    }
});

conesContainer.addEventListener('dragover', event => {
    event.preventDefault();
    if (draggedBall && pathElement) {
        const startRect = draggedBall.parentElement.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;

        const endX = event.clientX;
        const endY = event.clientY;

        // Create a quadratic Bezier curve for the curvy line
        const controlX = (startX + endX) / 2;
        const controlY = startY - 50; // Adjust control point for the curve

        const path = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
        pathElement.querySelector('path').setAttribute('d', path);
    }
});


let wrongSoundC;
function initWrongAudioC() {
    wrongSoundC = new Audio('assets/wrong.mp3');
    wrongSoundC.load(); // Preload
}
// Call this once, in a user interaction (e.g., touchstart or click)
document.addEventListener('touchstart', initWrongAudioC, { once: true });
document.addEventListener('click', initWrongAudioC, { once: true });
// Modify the drop logic to prevent cones from holding more than 4 balls
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
            targetConeArray.length < 4 && // Ensure the target cone has space for the ball
            (targetConeArray.length === 0 || targetConeArray[targetConeArray.length - 1] === ballColor)
        ) {
            console.log(`Valid move: Moving balls of color ${ballColor}`);

            // Remove the top ball from the source cone
            const removedBallColor = sourceCone.pop();
            if (removedBallColor !== ballColor) {
                console.error('Mismatch between dragged ball and source cone top ball');
                // const cheeringSound = new Audio('assets/wrong.mp3'); // Ensure the file exists in the specified path
                // cheeringSound.play();
                if (wrongSound) {
                    wrongSound.currentTime = 0;
                    wrongSound.play().catch(err => console.warn('Audio play failed:', err));
                }
                draggedBall = null;
                return;
            }

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
            console.log('Invalid move: Target cone does not match color or is full');
            // const cheeringSound = new Audio('assets/wrong.mp3'); // Ensure the file exists in the specified path
            // cheeringSound.play();
            if (wrongSoundC) {
                wrongSoundC.currentTime = 0;
                wrongSoundC.play().catch(err => console.warn('Audio play failed:', err));
            }
            draggedBall = null; // Reset draggedBall if the move is invalid
        }
    }
    if (lineElement) {
        lineElement.remove();
        lineElement = null;
    }
    if (pathElement) {
        pathElement.remove();
        pathElement = null;
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

let cheeringSound;
function initAudio() {
    cheeringSound = new Audio('assets/wow.mp3');
    cheeringSound.load(); // Preload
}
// Call this once, in a user interaction (e.g., touchstart or click)
document.addEventListener('touchstart', initAudio, { once: true });
document.addEventListener('click', initAudio, { once: true });

// Function to trigger full-screen celebration on win
function celebrateWin() {

    // Play cheering sound
    // const cheeringSound = new Audio('assets/wow.mp3'); cheeringSound.play();
    if (cheeringSound) {
        cheeringSound.currentTime = 0;
        cheeringSound.play().catch(err => console.warn('Audio play failed:', err));
    }

    const celebrationOverlay = document.createElement('div');
    celebrationOverlay.id = 'celebration-overlay';
    celebrationOverlay.innerHTML = `
        <div class="celebration-message">🎉Congratulations!! You Won! 🎉</div>
    `;
    document.body.appendChild(celebrationOverlay);

    setTimeout(() => {
        celebrationOverlay.remove();
    }, 3000);
}

// Check if the player has won
function checkWinCondition() {
    const filledCones = cones.filter(cone => cone.length === 4 && new Set(cone).size === 1);
    const emptyCones = cones.filter(cone => cone.length === 0);

    console.log(`Checking win condition: Filled cones = ${filledCones.length}, Empty cones = ${emptyCones.length}, Additional cones = ${additionalCones}`);

    // Trigger celebration for each completed cone
    cones.forEach((cone, index) => {
        if (cone.length === 4 && new Set(cone).size === 1) {
            celebrateConeCompletion(index);
        }
    });

    // Win condition: All filled cones have balls of the same color, 2 cones empty + additional cones
    if ((filledCones.length + emptyCones.length) === cones.length) {
        celebrateWin();
        level++; // Increase level
        setTimeout(initGame, 2000); // Start the next level after 2 seconds
    }
}

// Check if all cones are full
function areAllConesFull() {
    const cones = document.querySelectorAll('.cone'); // Assuming cones have the class 'cone'
    const maxBallsPerCone = 4; // Replace with the actual maximum number of balls per cone

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

let additionalCones = 0; // Track the number of additional cones added
const maxAdditionalCones = 3; // Maximum number of additional cones allowed
let addConeCooldown = false; // Cooldown flag for adding cones

// Function to add a new cone
function addCone() {
    if (additionalCones >= maxAdditionalCones) {
        alert('You can only add a maximum of 3 additional cones.');
        return;
    }

    if (addConeCooldown) {
        alert('Please wait 1 minute before adding another cone.');
        return;
    }

    const newCone = document.createElement('div');
    newCone.classList.add('cone');
    newCone.dataset.index = cones.length; // Assign the next index
    cones.push([]); // Add an empty array for the new cone
    conesContainer.appendChild(newCone);
    additionalCones++; // Increment the count of additional cones
    console.log(`New cone added at index ${cones.length - 1}`);

    // Start cooldown
    addConeCooldown = true;
    setTimeout(() => {
        addConeCooldown = false;
        console.log('Cooldown ended. You can add another cone.');
    }, 60000); // 1 minute cooldown
}

// Add event listener to the "Add Cone" button
document.getElementById('add-cone-button').addEventListener('click', addCone);

// Reset the game
resetButton.addEventListener('click', initGame);

// Load game data on page load
window.addEventListener('load', () => {
    loadGameData();
    initGame();
});