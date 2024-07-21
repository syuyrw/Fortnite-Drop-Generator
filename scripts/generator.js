const HISTORY_ARRAY_SIZE = 5;

// List of map locations with coordinates
var pois = [
    { name: "Brawler's Battleground", x: 1830, y: 1822 },
    { name: "Classy Courts", x: 1774, y: 374 },
    { name: "Grand Glacier", x: 2216, y: 968 },
    { name: "Grim Gate", x: 826, y: 952 },
    { name: "Lavish Lair", x: 1236, y: 488 },
    { name: "Mount Olympus", x: 1884, y: 1514 },
    { name: "Pleasant Piazza", x: 744, y: 1224 },
    { name: "Reckless Railways", x: 1768, y: 948 },
    { name: "Restored Reels", x: 1243, y: 1072 },
    { name: "Sandy Steppes", x: 732, y: 1662 },
    { name: "The Underworld", x: 576, y: 702 },
    { name: "Nitrodrome", x: 1200, y: 1431 },
    { name: "Brutal Beachhead", x: 930, y: 1971 },
    { name: "Redline Rig", x: 1486, y: 1904 },
    { name: "Shipwreck Shallows", x: 1450, y: 1272},
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
        mapImg.parentNode.appendChild(marker); // Append new marker
    }

    // Calculate position with adjustments for centering
    var mapContainer = mapImg.parentNode;
    var imgAspectRatio = mapImg.naturalWidth / mapImg.naturalHeight;
    var containerAspectRatio = mapContainer.clientWidth / mapContainer.clientHeight;

    var markerX, markerY;

    if (imgAspectRatio > containerAspectRatio) {
        // Image is constrained by width
        var scaleFactor = mapContainer.clientWidth / mapImg.naturalWidth;
        markerX = randomLocation.x * scaleFactor;
        var imgHeightScaled = mapImg.naturalHeight * scaleFactor;
        var verticalOffset = (mapContainer.clientHeight - imgHeightScaled) / 2;
        markerY = verticalOffset + randomLocation.y * scaleFactor;
    } else {
        // Image is constrained by height
        var scaleFactor = mapContainer.clientHeight / mapImg.naturalHeight;
        markerY = randomLocation.y * scaleFactor;
        var imgWidthScaled = mapImg.naturalWidth * scaleFactor;
        var horizontalOffset = (mapContainer.clientWidth - imgWidthScaled) / 2;
        markerX = horizontalOffset + randomLocation.x * scaleFactor;
    }

    marker.style.left = markerX + "px";
    marker.style.top = markerY + "px";
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
    // var history = 'Previous Drops: ';
    // for (let i = 0; i < previousDrops.length; i++) {
    //     history = history + previousDrops[i];
    //     if (i != previousDrops.length - 1) {
    //         history = history + ", ";
    //     }
    // }

    // // Display the history
    // var historyDisplay = document.getElementById('history');
    // historyDisplay.textContent = history;

    // Store the array into local storage
    const jsonPreviousDrops = JSON.stringify(previousDrops);
    localStorage.setItem('previousDrops', jsonPreviousDrops);
}

// Ensure no initial marker is displayed
document.addEventListener("DOMContentLoaded", function () {
    var dropButton = document.querySelector(".drop-button");
    dropButton.addEventListener("click", function () {
        displayRandomMarker(); // Call displayRandomMarker when the drop-button is clicked
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
    if (canvas.naturalWidth / canvas.naturalHeight > canvas.clientWidth / canvas.clientHeight) {
        // Width is the limiting factor
        var scaleFactor = canvas.clientWidth / canvas.naturalWidth;
        var adjustedY = (canvas.clientHeight - (canvas.naturalHeight * scaleFactor)) / 2;
        x = ((x + centerX) / canvas.naturalWidth) * canvas.clientWidth;
        y = adjustedY + ((y + centerY) / canvas.naturalHeight) * (canvas.clientWidth / canvas.naturalWidth * canvas.naturalHeight);
    } else {
        // Height is the limiting factor
        var scaleFactor = canvas.clientHeight / canvas.naturalHeight;
        var adjustedX = (canvas.clientWidth - (canvas.naturalWidth * scaleFactor)) / 2;
        x = adjustedX + ((x + centerX) / canvas.naturalWidth) * (canvas.clientHeight / canvas.naturalHeight * canvas.naturalWidth);
        y = ((y + centerY) / canvas.naturalHeight) * canvas.clientHeight;
    }

    nodeMarker.style.left = x + "px";
    nodeMarker.style.top = y + "px";
}

document.addEventListener("DOMContentLoaded", function () {
    var randSpot = document.getElementById("rand-spot");
    randSpot.addEventListener("click", function () {
        displayRandomSpot(); // Calls function to generate random spot when clicked.
    });
});
