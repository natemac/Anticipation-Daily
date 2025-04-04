// builderExport.js - Handles export and import of drawings

import BuilderState from './builderState.js';

// Validate recording data
export function validateRecording() {
    // Get UI elements for validation
    const itemNameInput = document.getElementById('itemName');
    const categoryName = document.getElementById('categoryName');
    
    if (BuilderState.recording.dots.length < 2) {
        alert('Please create at least 2 points in the recording.');
        return false;
    }

    if (BuilderState.recording.sequence.length === 0) {
        alert('Please record a drawing sequence.');
        return false;
    }

    if (!itemNameInput.value.trim()) {
        alert('Please enter a name for the item.');
        itemNameInput.focus();
        return false;
    }

    if (!categoryName.value.trim()) {
        alert('Please enter a category name.');
        categoryName.focus();
        return false;
    }

    return true;
}

// Get recording data for export
export function getExportData() {
    // Get UI elements for export
    const itemNameInput = document.getElementById('itemName');
    const categoryName = document.getElementById('categoryName');
    
    // Collect only dots used in the recording sequence
    const usedDotIndices = new Set();
    BuilderState.recording.sequence.forEach(line => {
        usedDotIndices.add(line.from);
        usedDotIndices.add(line.to);
    });

    // Create a map from old indices to new indices
    const indexMap = {};
    const usedDots = [];

    // Add only the used dots to the exported data
    Array.from(usedDotIndices).sort((a, b) => a - b).forEach((oldIndex, newIndex) => {
        indexMap[oldIndex] = newIndex;
        usedDots.push({
            x: BuilderState.recording.dots[oldIndex].x,
            y: BuilderState.recording.dots[oldIndex].y
        });
    });

    // Remap the line indices
    const remappedSequence = BuilderState.recording.sequence.map(line => ({
        from: indexMap[line.from],
        to: indexMap[line.to]
    }));

    // Get the category name or use a default if not provided
    const categoryNameValue = categoryName.value.trim() || 'Miscellaneous';

    // Return clean data for export in the new format
    return {
        name: itemNameInput.value.trim().toUpperCase(),
        categoryName: categoryNameValue,
        dots: usedDots,
        sequence: remappedSequence,
    };
}

// Import drawing data from JSON file
export function importDrawingData(jsonData) {
    try {
        // Parse the JSON data if it's a string
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (!data || !data.dots || !data.sequence) {
            throw new Error('Invalid data format');
        }
        
        // Reset current state
        BuilderState.recording.dots = [];
        BuilderState.recording.lines = [];
        BuilderState.recording.sequence = [];
        
        // Get UI elements for import
        const itemNameInput = document.getElementById('itemName');
        const categoryName = document.getElementById('categoryName');
        
        // Set name and category
        if (data.name) itemNameInput.value = data.name;
        if (data.categoryName) categoryName.value = data.categoryName;
        
        // Import dots
        data.dots.forEach(dot => {
            // Convert from exported format to internal format
            const gridX = Math.round(dot.x / BuilderState.gridPointSize);
            const gridY = Math.round(dot.y / BuilderState.gridPointSize);
            
            BuilderState.recording.dots.push({
                x: dot.x,
                y: dot.y,
                gridX,
                gridY
            });
        });
        
        // Import lines and sequence
        data.sequence.forEach(line => {
            // Add to lines
            BuilderState.recording.lines.push({
                from: line.from,
                to: line.to
            });
            
            // Add to sequence
            BuilderState.recording.sequence.push({
                from: line.from,
                to: line.to
            });
        });
        
        return true;
    } catch (error) {
        console.error('Error importing drawing data:', error);
        alert(`Failed to import drawing: ${error.message}`);
        return false;
    }
}

// Load JSON from file upload
export function loadJsonFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}
