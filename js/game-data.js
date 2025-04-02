// Game data for Daily Anticipation

// Game categories configuration
const gameCategories = {
    travel: {
        id: 'yellow',
        name: 'Travel',
        description: 'Places & Transport',
        color: '#fcdb4f'
    },
    food: {
        id: 'green',
        name: 'Food',
        description: 'Edible Items',
        color: '#4CAF50'
    },
    manmade: {
        id: 'blue',
        name: 'Man-made',
        description: 'Created Objects',
        color: '#2196F3'
    },
    leisure: {
        id: 'red',
        name: 'Leisure',
        description: 'Fun & Games',
        color: '#F44336'
    }
};

// Load item data from JSON files
async function loadCategoryItems(categoryId) {
    try {
        // Get the color ID for the category (yellow, red, blue, green)
        const colorId = gameCategories[categoryId]?.id || categoryId;

        // Load the JSON file
        const response = await fetch(`items/${colorId}.json`);

        if (!response.ok) {
            throw new Error(`Failed to load ${colorId}.json`);
        }

        const itemData = await response.json();
        return itemData;
    } catch (error) {
        console.error('Error loading category items:', error);
        throw error;
    }
}

// Get a random item for today based on date seed
function getTodayItem(categoryId) {
    // Use a date-based seed to ensure everyone gets the same puzzle on the same day
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    // We'll load the item asynchronously
    return loadCategoryItems(categoryId)
        .then(itemData => {
            // Use a simple hash of the date string to pick an item
            const dateHash = simpleHash(dateString);
            const itemIndex = dateHash % itemData.length;

            return itemData[itemIndex];
        });
}

// Simple string hash function
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
