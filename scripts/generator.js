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

    var marker = document.createElement("div");
    marker.classList.add("marker");
    marker.textContent = randomLocation.name;
    marker.style.position = "absolute";
    // Calculate position with adjustments for centering
    var markerX =
        ((randomLocation.x - 160) / mapImg.width) * 100 -
        (marker.offsetWidth / 2 / mapImg.width) * 100;
    var markerY =
        ((randomLocation.y - 100) / mapImg.height) * 100 -
        (marker.offsetHeight / 2 / mapImg.height) * 100;

    marker.style.left = markerX + "%";
    marker.style.top = markerY + "%";
    mapImg.parentNode.appendChild(marker); // Append marker to the parent of mapImg (usually .map)
}

document.addEventListener("DOMContentLoaded", function () {
    displayRandomMarker();
});

document.addEventListener("DOMContentLoaded", function () {
    var dropButton = document.getElementById("drop-button");
    dropButton.addEventListener("click", function () {
        location.reload();
    });
});
