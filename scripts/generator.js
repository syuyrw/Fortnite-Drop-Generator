// generator.js (self-contained)

/* ========= DOM ========= */
const mapWrapper = document.querySelector(".map-wrapper"); // should be position: relative in CSS
const mapImg = document.querySelector(".map-img"); // <img> that displays the map
const dropButton = document.querySelector(".drop-button"); // "Random POI" button
const randSpotBtn = document.getElementById("rand-spot"); // "Random Spot" button
const totalEl = document.getElementById("total"); // total clicks display
const nodeMarker = document.getElementById("node-marker"); // optional dot marker

if (dropButton) dropButton.disabled = true;
if (randSpotBtn) randSpotBtn.disabled = true;

/* ========= State ========= */
let pois = []; // [{ name, x, y, z }]
let shuffledPois = [];
let currentIndex = 0;

// computed once after data load to align world <-> image
let WORLD_CX = 0;
let WORLD_CY = 0;
let RANGE_X = 115000;
let RANGE_Y = 115000;

/* ========= Utils ========= */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function waitForImage(img) {
    return new Promise((resolve) => {
        if (img && img.complete && img.naturalWidth > 0) return resolve();
        img.addEventListener("load", () => resolve(), { once: true });
    });
}

/**
 * Convert Fortnite world coords (centered around ~0,0) -> NATURAL image pixel coords.
 * We do NOT invert Y for this map (positive Y should map downward in pixels).
 * Uses calibrated center (WORLD_CX/WORLD_CY) and half-ranges (RANGE_X/RANGE_Y).
 */
function worldToImagePixel(x, y, imgW, imgH) {
    const halfW = imgW / 2;
    const halfH = imgH / 2;

    const sx = halfW / RANGE_X;
    const sy = halfH / RANGE_Y;
    const s = Math.min(sx, sy); // keep aspect

    const px = halfW + (x - WORLD_CX) * s * 0.66; // +x right
    const py = halfH + (y - WORLD_CY) * s * 0.66; // +y down
    return { px, py };
}

/**
 * Convert NATURAL image pixels -> ON-SCREEN pixels inside mapWrapper (handles letterboxing).
 */
function imagePixelToScreen(px, py, imgW, imgH, containerW, containerH) {
    const imgAspect = imgW / imgH;
    const containerAspect = containerW / containerH;

    if (imgAspect > containerAspect) {
        // constrained by width
        const scale = containerW / imgW;
        const imgHeightScaled = imgH * scale;
        const vOffset = (containerH - imgHeightScaled) / 2;
        return { x: px * scale, y: vOffset + py * scale };
    } else {
        // constrained by height
        const scale = containerH / imgH;
        const imgWidthScaled = imgW * scale;
        const hOffset = (containerW - imgWidthScaled) / 2;
        return { x: hOffset + px * scale, y: py * scale };
    }
}

function getOrCreateMarker() {
    let marker = document.querySelector(".marker");
    if (!marker) {
        marker = document.createElement("div");
        marker.className = "marker";
        (mapWrapper || mapImg.parentElement).appendChild(marker);
    } else {
        // ensure only one marker exists
        document
            .querySelectorAll(".marker:not(:first-of-type)")
            .forEach((m) => m.remove());
    }
    return marker;
}

/* ========= Core actions ========= */
function displayRandomMarker() {
    if (!shuffledPois.length) {
        console.warn("POIs not ready");
        return;
    }
    if (!(mapImg && mapImg.naturalWidth && mapImg.naturalHeight)) {
        console.warn("Image not ready");
        return;
    }

    if (currentIndex >= shuffledPois.length) {
        shuffledPois = shuffle([...pois]);
        currentIndex = 0;
    }

    const pick = shuffledPois[currentIndex++]; // { name, x, y, z }
    const imgW = mapImg.naturalWidth;
    const imgH = mapImg.naturalHeight;
    const cw = (mapWrapper || mapImg.parentElement).clientWidth;
    const ch = (mapWrapper || mapImg.parentElement).clientHeight;

    // world -> image (natural pixels)
    const { px, py } = worldToImagePixel(pick.x, pick.y, imgW, imgH);
    // image -> screen (on-page pixels)
    const { x, y } = imagePixelToScreen(px, py, imgW, imgH, cw, ch);

    const marker = getOrCreateMarker();
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.textContent = pick.name;
    marker.style.visibility = "visible";

    if (nodeMarker) nodeMarker.style.visibility = "hidden";
}

function displayRandomSpot() {
    const marker = document.querySelector(".marker");
    if (nodeMarker && marker) {
        nodeMarker.style.visibility = "visible";
        marker.style.visibility = "hidden";
    }

    if (!(mapImg && mapImg.naturalWidth && mapImg.naturalHeight)) return;

    const imgW = mapImg.naturalWidth;
    const imgH = mapImg.naturalHeight;
    const cw = (mapWrapper || mapImg.parentElement).clientWidth;
    const ch = (mapWrapper || mapImg.parentElement).clientHeight;

    // random point in a circle centered on image center (natural pixel space)
    const cx = imgW / 2;
    const cy = imgH / 2;
    const radius = Math.min(cx, cy) * 0.8;

    const angle = Math.random() * Math.PI * 2;
    const r = radius * Math.sqrt(Math.random());
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);

    const { x, y } = imagePixelToScreen(px, py, imgW, imgH, cw, ch);

    if (nodeMarker) {
        nodeMarker.style.left = `${x}px`;
        nodeMarker.style.top = `${y}px`;
    }
}

/* ========= Init ========= */
(async function init() {
    try {
        // Fetch map & POIs
        const res = await fetch("https://fortnite-api.com/v1/map");
        const json = await res.json();

        // Use the BLANK map (no baked-in labels)
        const apiMapUrl = json?.data?.images?.blank || json?.data?.images?.pois;
        if (apiMapUrl) {
            const imgLoaded = waitForImage(mapImg);
            mapImg.src = apiMapUrl;
            await imgLoaded;
        } else {
            await waitForImage(mapImg);
        }

        // Build named POIs with world coords
        const rawPois = json?.data?.pois ?? [];
        const named = rawPois.filter((p) =>
            p?.id?.startsWith("Athena.Location.POI.")
        );
        pois = named.map((p) => ({
            name: p.name,
            x: Number(p.location?.x ?? 0),
            y: Number(p.location?.y ?? 0),
            z: Number(p.location?.z ?? 0),
        }));

        // Calibrate world center and ranges from the dataset (removes global drift)
        if (pois.length) {
            const xs = pois.map((p) => p.x);
            const ys = pois.map((p) => p.y);
            const minX = Math.min(...xs),
                maxX = Math.max(...xs);
            const minY = Math.min(...ys),
                maxY = Math.max(...ys);

            WORLD_CX = (minX + maxX) / 2;
            WORLD_CY = (minY + maxY) / 2;

            // symmetric half-range about center so everything fits with preserved aspect
            RANGE_X = Math.max(maxX - WORLD_CX, WORLD_CX - minX) || 115000;
            RANGE_Y = Math.max(maxY - WORLD_CY, WORLD_CY - minY) || 115000;
        }

        // Prepare order
        shuffledPois = shuffle([...pois]);
        currentIndex = 0;

        // Enable buttons now that image & data are ready
        if (dropButton) dropButton.disabled = false;
        if (randSpotBtn) randSpotBtn.disabled = false;
    } catch (err) {
        console.error("Init failed:", err);
    }

    // Wire buttons
    if (dropButton) {
        dropButton.addEventListener("click", () => {
            displayRandomMarker();

            // Click tracker
            fetch("https://click-tracker-server-avsz.onrender.com/click", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (totalEl && data?.total != null) {
                        totalEl.textContent = Number(
                            data.total
                        ).toLocaleString();
                    }
                })
                .catch(() => {});
        });
    }

    if (randSpotBtn) {
        randSpotBtn.addEventListener("click", () => {
            displayRandomSpot();

            // Click tracker
            fetch("https://click-tracker-server-avsz.onrender.com/click", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (totalEl && data?.total != null) {
                        totalEl.textContent = Number(
                            data.total
                        ).toLocaleString();
                    }
                })
                .catch(() => {});
        });
    }

    // Initial total + polling
    fetch("https://click-tracker-server-avsz.onrender.com/clicks")
        .then((r) => r.json())
        .then((data) => {
            if (totalEl && data?.total != null) {
                totalEl.textContent = Number(data.total).toLocaleString();
            }
        })
        .catch(() => {});

    setInterval(() => {
        fetch("https://click-tracker-server-avsz.onrender.com/clicks")
            .then((r) => r.json())
            .then((data) => {
                if (totalEl && data?.total != null) {
                    totalEl.textContent = Number(data.total).toLocaleString();
                }
            })
            .catch(() => {});
    }, 5000);
})();
