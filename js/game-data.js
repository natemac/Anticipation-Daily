// Default drawing data for each category
const gameData = {
    yellow: {
        name: "AIRPLANE",
        dots: [
            {x: 100, y: 200},
            {x: 300, y: 200},
            {x: 400, y: 150},
            {x: 300, y: 100},
            {x: 100, y: 100},
            {x: 200, y: 150},
            {x: 150, y: 250},
            {x: 250, y: 250}
        ],
        sequence: [
            {from: 0, to: 1},
            {from: 1, to: 2},
            {from: 2, to: 3},
            {from: 3, to: 4},
            {from: 4, to: 0},
            {from: 4, to: 5},
            {from: 5, to: 3},
            {from: 0, to: 6},
            {from: 6, to: 7},
            {from: 7, to: 1}
        ]
    },
    green: {
        name: "PIZZA",
        dots: [
            {x: 200, y: 100},
            {x: 100, y: 250},
            {x: 300, y: 250},
            {x: 150, y: 200},
            {x: 200, y: 175},
            {x: 250, y: 200}
        ],
        sequence: [
            {from: 0, to: 1},
            {from: 0, to: 2},
            {from: 1, to: 2},
            {from: 0, to: 3},
            {from: 0, to: 4},
            {from: 0, to: 5}
        ]
    },
    blue: {
        name: "CHAIR",
        dots: [
            {x: 150, y: 100},
            {x: 250, y: 100},
            {x: 250, y: 200},
            {x: 150, y: 200},
            {x: 150, y: 300},
            {x: 250, y: 300}
        ],
        sequence: [
            {from: 0, to: 1},
            {from: 1, to: 2},
            {from: 2, to: 3},
            {from: 3, to: 0},
            {from: 3, to: 4},
            {from: 2, to: 5}
        ]
    },
    red: {
        name: "TENNIS RACKET",
        dots: [
            {x: 200, y: 100},
            {x: 150, y: 150},
            {x: 150, y: 200},
            {x: 200, y: 250},
            {x: 250, y: 200},
            {x: 250, y: 150},
            {x: 200, y: 300}
        ],
        sequence: [
            {from: 0, to: 1},
            {from: 1, to: 2},
            {from: 2, to: 3},
            {from: 3, to: 4},
            {from: 4, to: 5},
            {from: 5, to: 0},
            {from: 3, to: 6}
        ]
    }
};
