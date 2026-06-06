// generator.js (self-contained)

/* ========= DOM ========= */
const mapWrapper = document.querySelector(".map-wrapper");
const mapImg = document.querySelector(".map-img");
const dropButton = document.querySelector(".drop-button");
const randSpotBtn = document.getElementById("rand-spot");
const totalEl = document.getElementById("total");
const nodeMarker = document.getElementById("node-marker");
const filterButton = document.getElementById("filter-button");
const poiSidebar = document.getElementById("poi-sidebar");
const poiOverlay = document.getElementById("poi-overlay");
const sidebarClose = document.getElementById("sidebar-close");
const selectAllBtn = document.getElementById("select-all");
const deselectAllBtn = document.getElementById("deselect-all");
const poiList = document.getElementById("poi-list");

if (dropButton) dropButton.disabled = true;
if (randSpotBtn) randSpotBtn.disabled = true;

/* ========= Constants ========= */
const DEFAULT_RANGE = 115000;
const RANDOM_SPOT_RADIUS_FACTOR = 0.8;
const WORLD_COORD_SCALE = 0.66;
const CLICK_TRACKER_URL = "https://click-tracker-server-avsz.onrender.com";
const POLL_INTERVAL_MS = 5000;

/* ========= State ========= */
let pois = [];
let shuffledPois = [];
let currentIndex = 0;
let WORLD_CX = 0;
let WORLD_CY = 0;
let RANGE_X = DEFAULT_RANGE;
let RANGE_Y = DEFAULT_RANGE;
let excludedPois = new Set();

const STORAGE_KEY = "fortnite_excluded_pois";

/* ========= Utils ========= */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isBlue(r, g, b) {
  // Convert RGB to HSL hue
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return false; // achromatic (gray/white/black)
  const d = max - min;
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  const hue = Math.round(h * 360);
  return hue >= 180 && hue <= 270;
}

function waitForImage(img) {
  return new Promise((resolve, reject) => {
    if (!img) return reject(new Error("waitForImage called with null img"));
    if (img.complete && img.naturalWidth > 0) return resolve();
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => reject(new Error("image failed to load")), { once: true });
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

  const px = halfW + (x - WORLD_CX) * s * WORLD_COORD_SCALE;
  const py = halfH + (y - WORLD_CY) * s * WORLD_COORD_SCALE;
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
    const host = mapWrapper || mapImg?.parentElement;
    if (!host) throw new Error("No host to append marker");
    host.appendChild(marker);
  } else {
    // ensure only one marker exists
    document.querySelectorAll(".marker:not(:first-of-type)").forEach((m) => m.remove());
  }
  return marker;
}

/* ========= POI Filtering ========= */
function loadExcludedPois() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      excludedPois = new Set(JSON.parse(stored));
    }
  } catch (err) {
    console.error("Failed to load excluded POIs:", err);
  }
}

function saveExcludedPois() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...excludedPois]));
  } catch (err) {
    console.error("Failed to save excluded POIs:", err);
  }
}

function populatePoiList() {
  if (!poiList || !pois.length) return;

  poiList.innerHTML = "";
  pois.forEach((poi) => {
    const item = document.createElement("div");
    item.className = "poi-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `poi-${poi.name}`;
    const isSelected = !excludedPois.has(poi.name);
    checkbox.checked = isSelected;
    if (isSelected) {
      checkbox.setAttribute('checked', 'checked');
    }
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        excludedPois.delete(poi.name);
      } else {
        excludedPois.add(poi.name);
      }
      saveExcludedPois();
      updateFilterButtonText();
    });

    const label = document.createElement("label");
    label.htmlFor = `poi-${poi.name}`;
    label.textContent = poi.name;

    item.appendChild(checkbox);
    item.appendChild(label);
    poiList.appendChild(item);
  });
}

function updateFilterButtonText() {
  if (!filterButton) return;
  const count = excludedPois.size;
  filterButton.textContent = count > 0 ? `Filter POIs (${count})` : "Filter POIs";
}

function toggleSidebar(open = null) {
  const shouldOpen = open !== null ? open : !poiSidebar.classList.contains("open");

  if (shouldOpen) {
    poiSidebar.classList.add("open");
    poiOverlay.classList.add("active");
  } else {
    poiSidebar.classList.remove("open");
    poiOverlay.classList.remove("active");
  }
}

function getFilteredPois() {
  return pois.filter((poi) => !excludedPois.has(poi.name));
}

/* ========= SEO ========= */
function generateDynamicKeywords(poiList = []) {
  const baseKeywords = ["Fortnite", "drop generator", "random drop", "map", "POI", "landing spots"];
  if (poiList.length > 0) {
    const topPois = poiList.slice(0, 8).map((p) => p.name);
    return [...baseKeywords, ...topPois].join(", ");
  }
  return baseKeywords.join(", ");
}

function updateMetadata(seasonName = "Fortnite", seasonNumber = null, poiList = []) {
  const title = seasonNumber
    ? `Fortnite Chapter ${seasonNumber} Drop Generator - Random POI Map`
    : `${seasonName} Drop Generator - Interactive Map Tool`;

  const description = seasonNumber
    ? `Generate random landing spots and POI locations in Fortnite Chapter ${seasonNumber}. Use our interactive map to find the best drop spots for your next match. Featured locations: ${poiList.slice(0, 3).map((p) => p.name).join(", ")}.`
    : "Generate random Fortnite drop locations and POI spots with this interactive map tool. Find the best landing spots for your strategy.";

  const keywords = generateDynamicKeywords(poiList);

  // Update page title
  document.title = title;
  document.getElementById("page-title").textContent = title;

  // Update meta tags
  document.getElementById("meta-description").content = description;
  document.getElementById("meta-keywords").content = keywords;
  document.getElementById("og-title").content = title;
  document.getElementById("og-description").content = description;
  document.getElementById("og-image-alt").content = `Interactive Fortnite Chapter ${seasonNumber || ""} map showing POI locations`;
  document.getElementById("twitter-title").content = title;
  document.getElementById("twitter-description").content = description;

  // Update schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": title,
    "url": "https://dropgenerator.com",
    "description": description,
    "keywords": keywords,
    "applicationCategory": "GameApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript",
    "image": {
      "@type": "ImageObject",
      "url": "https://fortnite-api.com/images/map.png",
      "width": 2048,
      "height": 2048
    },
    "author": {
      "@type": "Person",
      "name": "Jordan Reitz"
    },
    "creator": {
      "@type": "Person",
      "name": "Jordan Reitz"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  // Add BreadcrumbList schema
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://dropgenerator.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": title,
        "item": "https://dropgenerator.com"
      }
    ]
  };

  // Add FAQPage schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the Fortnite Drop Generator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Fortnite Drop Generator is an interactive tool that helps you find random landing spots and POI locations on the Fortnite Battle Royale map."
        }
      },
      {
        "@type": "Question",
        "name": "How do I use this Fortnite map tool?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Click the 'Random POI' button to get a named location or 'Random Spot' button to get a random coordinate. The map will highlight your randomly selected landing spot."
        }
      },
      {
        "@type": "Question",
        "name": "Is this Fortnite drop tool free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, this interactive Fortnite map drop generator is completely free to use. No registration or payment required."
        }
      }
    ]
  };

  // Update main schema
  document.getElementById("schema-json").textContent = JSON.stringify(schemaData);

  // Add additional schemas to body
  let schemaContainer = document.getElementById("seo-schemas");
  if (!schemaContainer) {
    schemaContainer = document.createElement("div");
    schemaContainer.id = "seo-schemas";
    schemaContainer.style.display = "none";
    document.body.appendChild(schemaContainer);
  }

  // Create or update breadcrumb schema
  let breadcrumbScript = document.getElementById("breadcrumb-schema");
  if (!breadcrumbScript) {
    breadcrumbScript = document.createElement("script");
    breadcrumbScript.id = "breadcrumb-schema";
    breadcrumbScript.type = "application/ld+json";
    document.head.appendChild(breadcrumbScript);
  }
  breadcrumbScript.textContent = JSON.stringify(breadcrumbs);

  // Create or update FAQ schema
  let faqScript = document.getElementById("faq-schema");
  if (!faqScript) {
    faqScript = document.createElement("script");
    faqScript.id = "faq-schema";
    faqScript.type = "application/ld+json";
    document.head.appendChild(faqScript);
  }
  faqScript.textContent = JSON.stringify(faqSchema);
}

/* ========= Tracking ========= */
async function trackClick() {
  try {
    const res = await fetch(`${CLICK_TRACKER_URL}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (totalEl && data?.total != null) {
      totalEl.textContent = Number(data.total).toLocaleString();
    }
  } catch (err) {
    // silently fail if tracker is unavailable
  }
}

async function updateClickCount() {
  try {
    const res = await fetch(`${CLICK_TRACKER_URL}/clicks`);
    const data = await res.json();
    if (totalEl && data?.total != null) {
      totalEl.textContent = Number(data.total).toLocaleString();
    }
  } catch (err) {
    // silently fail if tracker is unavailable
  }
}

/* ========= Core actions ========= */
function displayRandomMarker() {
  const filteredPois = getFilteredPois();
  if (!filteredPois.length) {
    console.warn("No POIs available after filtering");
    return;
  }
  if (!(mapImg && mapImg.naturalWidth && mapImg.naturalHeight)) {
    console.warn("Image not ready");
    return;
  }

  if (currentIndex >= filteredPois.length) {
    const shuffled = shuffle([...filteredPois]);
    shuffledPois = shuffled;
    currentIndex = 0;
  }

  const pick = shuffledPois[currentIndex++]; // { name, x, y, z }
  const imgW = mapImg.naturalWidth;
  const imgH = mapImg.naturalHeight;

  const container = mapWrapper || mapImg.parentElement;
  if (!container) {
    console.warn("No container for map/marker");
    return;
  }
  const cw = container.clientWidth;
  const ch = container.clientHeight;

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
  // Show the red dot marker
  if (nodeMarker) nodeMarker.style.visibility = "visible";

  // Hide any existing text marker (if it exists)
  const marker = document.querySelector(".marker");
  if (marker) marker.style.visibility = "hidden";

  if (!(mapImg && mapImg.naturalWidth && mapImg.naturalHeight)) return;

  const imgW = mapImg.naturalWidth;
  const imgH = mapImg.naturalHeight;

  const container = mapWrapper || mapImg.parentElement;
  if (!container) return;
  const cw = container.clientWidth;
  const ch = container.clientHeight;

  // Enable CORS for pixel sampling
  mapImg.crossOrigin = "anonymous";

  // Create canvas for color sampling
  const canvas = document.createElement("canvas");
  canvas.width = imgW;
  canvas.height = imgH;
  const ctx = canvas.getContext("2d");

  try {
    ctx.drawImage(mapImg, 0, 0);
  } catch (e) {
    console.warn("Could not sample map colors for island detection:", e);
  }

  // Generate random point anywhere on the map
  let px, py;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    px = Math.random() * imgW;
    py = Math.random() * imgH;
    attempts++;

    try {
      const imageData = ctx.getImageData(Math.floor(px), Math.floor(py), 1, 1);
      const [red, green, blue] = imageData.data;

      // If not blue (not water), use this spot
      if (!isBlue(red, green, blue)) {
        break;
      }
    } catch (e) {
      // If we can't sample pixels, use the spot anyway
      break;
    }
  } while (attempts < maxAttempts);

  const { x, y } = imagePixelToScreen(px, py, imgW, imgH, cw, ch);

  if (nodeMarker) {
    nodeMarker.style.left = `${x}px`;
    nodeMarker.style.top = `${y}px`;
  }
}

/* ========= Init ========= */
(async function init() {
  try {
    // Load excluded POIs from localStorage
    loadExcludedPois();

    // Fetch map & POIs (JSON endpoint)
    const res = await fetch("https://fortnite-api.com/v1/map");
    if (!res.ok) throw new Error(`Map fetch failed: ${res.status}`);
    const json = await res.json();

    // Extract season info for SEO
    const currentSeason = json?.data?.season;
    const seasonNumber = currentSeason?.number;
    const seasonName = currentSeason?.name || "Fortnite";

    // Build POI list for SEO (will be populated after filtering)
    const rawPois = json?.data?.pois ?? [];
    const named = rawPois.filter((p) => p?.id?.startsWith("Athena.Location.POI."));
    const seoPoiList = named.map((p) => ({
      name: p.name,
      x: Number(p.location?.x ?? 0),
      y: Number(p.location?.y ?? 0),
      z: Number(p.location?.z ?? 0),
    }));

    updateMetadata(seasonName, seasonNumber, seoPoiList);

    // Use the BLANK map (no baked-in labels)
    const apiMapUrl = json?.data?.images?.blank || json?.data?.images?.pois;
    if (!mapImg) throw new Error("Missing .map-img element");
    if (apiMapUrl) {
      mapImg.src = apiMapUrl;
      await waitForImage(mapImg);
    } else {
      // if your HTML already has a src
      await waitForImage(mapImg);
    }





    // Use the POI list from SEO for main functionality
    pois = seoPoiList;

    // Calibrate world center and ranges from the dataset (removes global drift)
    if (pois.length) {
      const xs = pois.map((p) => p.x);
      const ys = pois.map((p) => p.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);

      WORLD_CX = (minX + maxX) / 2;
      WORLD_CY = (minY + maxY) / 2;

      // symmetric half-range about center so everything fits with preserved aspect
      RANGE_X = Math.max(maxX - WORLD_CX, WORLD_CX - minX) || 115000;
      RANGE_Y = Math.max(maxY - WORLD_CY, WORLD_CY - minY) || 115000;
    }

    // Prepare order with filtered POIs
    const filteredPois = getFilteredPois();
    shuffledPois = shuffle([...filteredPois]);
    currentIndex = 0;

    // Populate POI list and update filter button
    populatePoiList();
    updateFilterButtonText();

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
      trackClick();
    });
  }

  if (randSpotBtn) {
    randSpotBtn.addEventListener("click", () => {
      displayRandomSpot();
      trackClick();
    });
  }

  // Filter button and sidebar
  if (filterButton) {
    filterButton.addEventListener("click", () => {
      toggleSidebar(true);
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener("click", () => {
      toggleSidebar(false);
    });
  }

  if (poiOverlay) {
    poiOverlay.addEventListener("click", () => {
      toggleSidebar(false);
    });
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      excludedPois.clear();
      saveExcludedPois();
      populatePoiList();
      updateFilterButtonText();
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener("click", () => {
      excludedPois = new Set(pois.map((p) => p.name));
      saveExcludedPois();
      populatePoiList();
      updateFilterButtonText();
    });
  }

  // Keyboard shortcut: Space bar generates random POI
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !dropButton.disabled) {
      e.preventDefault();
      displayRandomMarker();
      trackClick();
    }
  });

  // Initial total + polling
  updateClickCount();
  setInterval(updateClickCount, POLL_INTERVAL_MS);
})();