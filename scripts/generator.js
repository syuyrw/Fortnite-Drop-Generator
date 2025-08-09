var pois = [
    { name: "Resistance Base", x: 440, y: 360 },
    { name: "Supernova Academy", x: 1040, y: 500 },
    { name: "Pumped Power", x: 1320, y: 590 },
    { name: "First Order Base", x: 1570, y: 350 },
    { name: "Foxy Floodgate", x: 930, y: 1130 },
    { name: "Utopia City", x: 1350, y: 1090 },
    { name: "Shining Span", x: 1580, y: 1080 },
    { name: "Shogun's Solitude", x: 360, y: 1600 },
    { name: "Canyon Crossing", x: 590, y: 1470 },
    { name: "Demon's Debris", x: 1080, y: 1460 },
    { name: "Outpost Enclave", x: 1480, y: 1600 },
    { name: "Kappa Kappa Factory", x: 1660, y: 1480 },
    { name: "Shiny Shafts", x: 440, y: 880 },
    { name: "Outlaw Oasis", x: 320, y: 1090 },
    { name: "The Hive", x: 720, y: 660 },
    { name: "Swarmy Stash", x: 1050, y: 680 },
    { name: "O.X.R. HQ", x: 1230, y: 720 },
    { name: "Rangers Ruin", x: 620, y: 1100 },
];

let buttonClicks = 0;

// Shuffle function using Fisher-Yates algorithm
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

var shuffledPois = shuffle([...pois]); // Create a shuffled copy of the POIs
var currentIndex = 0;

// Function to pick a random POI and display its name as a marker
function displayRandomMarker() {
    // If all POIs have been used, reshuffle and reset index
    if (currentIndex >= shuffledPois.length) {
        shuffledPois = shuffle([...pois]);
        currentIndex = 0;
    }

    var randomLocation = shuffledPois[currentIndex]; // Get the current POI

    var mapImg = document.querySelector(".map-img");

    // Try to find an existing marker
    var marker = document.querySelector(".marker");

    // No existing marker, create a new one
    if (!marker) {
        marker = document.createElement("div");
        marker.classList.add("marker");
        mapImg.parentNode.appendChild(marker); // Append new marker
    }

    // Calculate position with adjustments for centering
    var mapContainer = mapImg.parentNode;
    var imgAspectRatio = mapImg.naturalWidth / mapImg.naturalHeight;
    var containerAspectRatio =
        mapContainer.clientWidth / mapContainer.clientHeight;

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

    var nodeMarker = document.getElementById("node-marker");
    nodeMarker.style.visibility = "hidden";
    marker.style.visibility = "visible";

    currentIndex++;
}

var dropButton = document.querySelector(".drop-button");
dropButton.addEventListener("click", function () {
    displayRandomMarker();
    // Pull total locations generated from server https://dashboard.render.com/web/srv-d22t4rbe5dus73a0i2k0/deploys/dep-d22t4rje5dus73a0i3bg
    fetch("https://click-tracker-server-avsz.onrender.com/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    })
        .then((res) => res.json())
        .then((data) => {
            document.getElementById("total").textContent =
                data.total.toLocaleString();
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
    var radius = (canvas.naturalWidth - centerX) * 0.8;

    var angle = Math.random() * 2 * Math.PI;

    var r = radius * Math.sqrt(Math.random());

    var x = r * Math.cos(angle);
    var y = r * Math.sin(angle);

    // Make coordinates align with center of the image
    if (
        canvas.naturalWidth / canvas.naturalHeight >
        canvas.clientWidth / canvas.clientHeight
    ) {
        // Width is the limiting factor
        var scaleFactor = canvas.clientWidth / canvas.naturalWidth;
        var adjustedY =
            (canvas.clientHeight - canvas.naturalHeight * scaleFactor) / 2;
        x = ((x + centerX) / canvas.naturalWidth) * canvas.clientWidth;
        y =
            adjustedY +
            ((y + centerY) / canvas.naturalHeight) *
                ((canvas.clientWidth / canvas.naturalWidth) *
                    canvas.naturalHeight);
    } else {
        // Height is the limiting factor
        var scaleFactor = canvas.clientHeight / canvas.naturalHeight;
        var adjustedX =
            (canvas.clientWidth - canvas.naturalWidth * scaleFactor) / 2;
        x =
            adjustedX +
            ((x + centerX) / canvas.naturalWidth) *
                ((canvas.clientHeight / canvas.naturalHeight) *
                    canvas.naturalWidth);
        y = ((y + centerY) / canvas.naturalHeight) * canvas.clientHeight;
    }

    nodeMarker.style.left = x + "px";
    nodeMarker.style.top = y + "px";
}

var randSpot = document.getElementById("rand-spot");
randSpot.addEventListener("click", function () {
    displayRandomSpot(); // Calls function to generate random spot when clicked.
    // Pull total locations generated from server https://dashboard.render.com/web/srv-d22t4rbe5dus73a0i2k0/deploys/dep-d22t4rje5dus73a0i3bg
    fetch("https://click-tracker-server-avsz.onrender.com/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    })
        .then((res) => res.json())
        .then((data) => {
            document.getElementById("total").textContent =
                data.total.toLocaleString();
        });
});

// Pull total locations generated from server on page load.
fetch("https://click-tracker-server-avsz.onrender.com/clicks")
    .then((res) => res.json())
    .then((data) => {
        document.getElementById("total").textContent =
            data.total.toLocaleString();
    });

//test

const intervalId = setInterval(function () {
    fetch("https://click-tracker-server-avsz.onrender.com/clicks")
        .then((res) => res.json())
        .then((data) => {
            document.getElementById("total").textContent =
                data.total.toLocaleString();
        });
}, 5000);
