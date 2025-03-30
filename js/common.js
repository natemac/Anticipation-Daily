// Utility function to load JSON data from file
async function loadJsonData(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            console.log(`Could not find ${filename}, will use default data`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.log(`Error loading ${filename}, will use default data`);
        return null;
    }
}

// Resize canvas to match container
function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}

// Update timer bar
function updateTimerBar(timerBar, current, total) {
    const percentage = (current / total) * 100;
    timerBar.style.width = `${percentage}%`;

    // Change color based on time remaining
    if (percentage > 60) {
        timerBar.style.backgroundColor = '#4CAF50'; // Green
    } else if (percentage > 30) {
        timerBar.style.backgroundColor = '#FFC107'; // Yellow
    } else {
        timerBar.style.backgroundColor = '#F44336'; // Red
    }
}
