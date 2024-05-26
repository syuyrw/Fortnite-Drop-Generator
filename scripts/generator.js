const HISTORY_ARRAY_SIZE = 5;

// List of map locations with coordinates
var pois = [
    { name: "Brawler's Battleground", x: 1530, y: 1822 },
    { name: "Classy Courts", x: 1574, y: 474 },
    { name: "Grand Glacier", x: 2016, y: 968 },
    { name: "Grim Gate", x: 726, y: 952 },
    { name: "Lavish Lair", x: 1136, y: 588 },
    { name: "Mount Olympus", x: 1784, y: 1464 },
    { name: "Pleasant Piazza", x: 544, y: 1224 },
    { name: "Rebel's Roost", x: 610, y: 436 },
    { name: "Reckless Railways", x: 1568, y: 948 },
    { name: "Restored Reels", x: 1043, y: 1072 },
    { name: "Sandy Steppes", x: 532, y: 1612 },
    { name: "The Underworld", x: 426, y: 752 },
    { name: "Nitrodrome", x: 1100, y: 1431 },
    { name: "Brutal Beachhead", x: 730, y: 1871 },
    { name: "Redline Rig", x: 1336, y: 1804 },
];

// Retrieve the JSON string from local storage
const jsonPreviousDrops = localStorage.getItem('previousDrops');

// Check if the retrieved value is not null
var previousDrops = jsonPreviousDrops !== null ? JSON.parse(jsonPreviousDrops) : [];

// Shuffle function using Fisher-Yates algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

var shuffledPois = shuffle([...pois]); // Create a shuffled copy of the POIs
var currentIndex = 0; // Index to keep track of the current POI in the shuffled array

// Function to pick a random POI and display its name as a marker
function displayRandomMarker() {
    // If all POIs have been used, reshuffle and reset index
    if (currentIndex >= shuffledPois.length) {
        shuffledPois = shuffle([...pois]);
        currentIndex = 0;
    }

    var randomLocation = shuffledPois[currentIndex]; // Get the current POI
    currentIndex++; // Move to the next POI in the shuffled array

    var mapImg = document.querySelector(".map-img"); // Get the map image element

    // Try to find an existing marker
    var marker = document.querySelector('.marker');

    // No existing marker, create a new one
    if (!marker) {
        marker = document.createElement("div");
        marker.classList.add("marker");
        marker.style.position = "absolute"; // Only needs to be set once
        mapImg.parentNode.appendChild(marker); // Append new marker
    }

    // Calculate position with adjustments for centering
    var markerX = (randomLocation.x / mapImg.naturalWidth) * 100; // Calculate x-coordinate relative to the natural width of the image
    var markerY = (randomLocation.y / mapImg.naturalHeight) * 100; // Calculate y-coordinate relative to the natural height of the image

    marker.style.left = markerX + "%";
    marker.style.top = markerY + "%";
    marker.textContent = randomLocation.name;

    updateDropHistory(randomLocation.name);

    var nodeMarker = document.getElementById("node-marker");
    nodeMarker.style.visibility = "hidden"; // Set visibility of nodeMarker to hidden
    marker.style.visibility = "visible";
}

function updateDropHistory(newDrop) {
    // Shift elements down one
    for (let i = HISTORY_ARRAY_SIZE - 1; i > 0; i--) {
        if (previousDrops[i - 1]) {
            previousDrops[i] = previousDrops[i - 1];
        }
    }

    previousDrops[0] = newDrop;
    previousDrops.length = HISTORY_ARRAY_SIZE;

    // Create display for the Users
    var history = 'Previous Drops: ';
    for (let i = 0; i < previousDrops.length; i++) {
        history = history + previousDrops[i];
        if (i != previousDrops.length - 1) {
            history = history + ", ";
        }
    }

    // Display the history
    var historyDisplay = document.getElementById('history');
    historyDisplay.textContent = history;

    // Store the array into local storage
    const jsonPreviousDrops = JSON.stringify(previousDrops);
    localStorage.setItem('previousDrops', jsonPreviousDrops);
}

document.addEventListener("DOMContentLoaded", function () {
    displayRandomMarker(); // Call displayRandomMarker function when the DOM content is loaded (i.e., page is refreshed)
});

document.addEventListener("DOMContentLoaded", function () {
    var dropButton = document.querySelector(".drop-button");
    dropButton.addEventListener("click", function () {
        displayRandomMarker(); // Reload the page when the drop-button is clicked
    });
});

function displayRandomSpot() {
    var nodeMarker = document.getElementById("node-marker");
    var marker = document.querySelector(".marker");

    // Check visibility and switch nodeMarker and marker if necessary
    if (nodeMarker.style.visibility === "hidden") {
        nodeMarker.style.visibility = "visible";
        marker.style.visibility = "hidden";
    }

    var canvas = document.querySelector(".map-img");
    var centerX = canvas.naturalWidth / 2;
    var centerY = canvas.naturalHeight / 2;
    var radius = (canvas.naturalWidth - centerX) * .8;

    // Generate random angle
    var angle = Math.random() * 2 * Math.PI;

    // Generate random radius
    var r = radius * Math.sqrt(Math.random());

    // Polar to Cartesian Coordinates
    var x = r * Math.cos(angle);
    var y = r * Math.sin(angle);

    // Make coordinates align with center of the image
    x = ((x + centerX) / canvas.naturalWidth) * 100;
    y = ((y + centerY) / canvas.naturalHeight) * 100;

    nodeMarker.style.left = x + "%";
    nodeMarker.style.top = y + "%";
}

document.addEventListener("DOMContentLoaded", function () {
    var randSpot = document.getElementById("rand-spot");
    randSpot.addEventListener("click", function () {
        displayRandomSpot(); // Calls function to generate random spot when clicked.
    });
});

