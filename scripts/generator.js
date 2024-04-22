// List of map locations with coordinates
var pois = [
    { name: "Brawler's Battleground", x: 1430, y: 1722 },
    { name: "Classy Courts", x: 1374, y: 474 },
    { name: "Fencing Fields", x: 924, y: 1374 },
    { name: "Grand Glacier", x: 1716, y: 968 },
    { name: "Grim Gate", x: 626, y: 952 },
    { name: "Lavish Lair", x: 936, y: 588 },
    { name: "Mount Olympus", x: 1484, y: 1464 },
    { name: "Pleasant Piazza", x: 544, y: 1224 },
    { name: "Rebel's Roost", x: 610, y: 436 },
    { name: "Reckless Railways", x: 1368, y: 948 },
    { name: "Restored Reels", x: 943, y: 1072 },
    { name: "Snooty Steppes", x: 532, y: 1612 },
    { name: "The Underworld", x: 426, y: 752 },
];

// Function to pick a random POI and display its name as a marker
function displayRandomMarker() {
    // Variable to store the index of the previously selected location
    

    var previousIndex = -1;

    var randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * pois.length);
    } while (randomIndex === previousIndex); // Keep generating random index until it's different from the previous one

    previousIndex = randomIndex; // Update the previous index

    var randomLocation = pois[randomIndex]; // Get the randomly selected location
    var mapImg = document.querySelector(".map-img"); // Get the map image element

    //Try to find an existing marker
    var marker = document.querySelector('.marker');

    // No existing marker, create a new one
    if (!marker) {
        marker = document.createElement("div");
        marker.classList.add("marker");
        marker.style.position = "absolute"; // Only needs to be set once
        var mapImg = document.querySelector(".map-img").parentNode;
        mapImg.appendChild(marker); // Append new marker
    }

    // Calculate position with adjustments for centering
    var markerX = (randomLocation.x / mapImg.naturalWidth) * 100; // Calculate x-coordinate relative to the natural width of the image
    var markerY = (randomLocation.y / mapImg.naturalHeight) * 100; // Calculate y-coordinate relative to the natural height of the image

    marker.style.left = markerX + "%";
    marker.style.top = markerY + "%";
    marker.textContent = randomLocation.name;
    // mapImg.parentNode.appendChild(marker); // Append marker to the parent of mapImg (usually .map)

    var nodeMarker = document.getElementById("node-marker");
    nodeMarker.style.visibility = "hidden"; // Set visibility of nodeMarker to hidden
    marker.style.visibility = "visible";
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
    var marker = document.querySelector(".marker")

    //Check visibility and switch nodeMarker and marker if necessary
    if (nodeMarker.style.visibility === "hidden"){
        nodeMarker.style.visibility = "visible";
        marker.style.visibility = "hidden";
    }

    var canvas = document.querySelector(".map-img");
    var centerX = canvas.naturalWidth / 2;
    var centerY = canvas.naturalHeight / 2;
    var radius = (canvas.naturalWidth - centerX) * .8;
    
    //Generate random angle
    var angle = Math.random() * 2 * Math.PI;

    //Generate random radius
    var r = radius * Math.sqrt(Math.random());

    //Polar to Cartesian Coordinates
    var x = r * Math.cos(angle);
    var y = r * Math.sin(angle);

    //Make coordinates aling with center of the image
    x = ((x + centerX)/canvas.naturalWidth) * 100;
    y = ((y+ centerY)/canvas.naturalHeight) * 100;

    nodeMarker.style.left = x + "%";
    nodeMarker.style.top = y + "%";
}

document.addEventListener("DOMContentLoaded", function () {
    var randSpot = document.getElementById("rand-spot");
    randSpot.addEventListener("click", function() {
        displayRandomSpot(); // Calls function to generate random spot when clicked.
    })
});
