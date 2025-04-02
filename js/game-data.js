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

        console.log(`Loading items from ${colorId}.json`);

        // Check if we're using the correct path
        const itemPath = `items/${colorId}.json`;
        console.log(`Attempting to fetch from: ${window.location.origin}/${itemPath}`);

        // Load the JSON file
        const response = await fetch(itemPath);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Could not find the file ${colorId}.json. Make sure it exists in the 'items' folder.`);
            } else {
                throw new Error(`Failed to load ${colorId}.json (status: ${response.status})`);
            }
        }

        // Parse and return the data
        const itemData = await response.json();
        console.log(`Successfully loaded ${colorId}.json:`, itemData);
        return itemData;
    } catch (error) {
        console.error(`Error loading category items for ${categoryId}:`, error);
        throw error;
    }
}

// Get a random item for today based on date seed
async function getTodayItem(categoryId) {
    try {
        // Use a date-based seed to ensure everyone gets the same puzzle on the same day
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        // Load the data for this category
        const itemData = await loadCategoryItems(categoryId);

        // If we got an object instead of an array, use it directly
        if (!Array.isArray(itemData)) {
            console.log("Item data is a single object, using directly");
            return itemData;
        }

        // Otherwise, select an item from the array
        if (itemData.length === 0) {
            throw new Error("No items found in this category");
        }

        // Use a simple hash of the date string to pick an item
        const dateHash = simpleHash(dateString);
        const itemIndex = dateHash % itemData.length;

        console.log(`Selected item ${itemIndex} of ${itemData.length}`);
        return itemData[itemIndex];
    } catch (error) {
        console.error("Error getting today's item:", error);
        throw error;
    }
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
