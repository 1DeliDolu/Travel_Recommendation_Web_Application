// travel_recommendation.js
"use strict";

/**
 * Task 6 + Task 8
 * - Fetch data from ./travel_recommendation_api.json (Fetch API)
 * - Cache it (no repeated fetch)
 * - Console.log data to verify access
 * - Search by keyword: beach, temple, or country (>=2 results each)
 * - Render results with image + description
 * - Wire Search + Clear buttons (Enter triggers Search)
 */

const DATA_URL = "./travel_recommendation_api.json";
let cachedApiData = null;

// ---------- Data ----------
async function loadData() {
    if ( cachedApiData ) return cachedApiData;

    const res = await fetch( DATA_URL, { cache: "no-store" } );
    if ( !res.ok ) throw new Error( `Failed to fetch JSON (${ res.status } ${ res.statusText })` );

    const data = await res.json();
    cachedApiData = data;

    // Task 6: verify access
    console.log( "✅ Travel recommendation data loaded:", data );

    return data;
}

function normalize( str ) {
    return String( str ?? "" ).trim().toLowerCase();
}

function citiesFromCountries( data ) {
    const out = [];
    const countries = Array.isArray( data?.countries ) ? data.countries : [];
    for ( const c of countries ) {
        const countryName = typeof c?.name === "string" ? c.name : "";
        const cities = Array.isArray( c?.cities ) ? c.cities : [];
        for ( const city of cities ) {
            out.push( {
                category: "Country",
                country: countryName,
                name: typeof city?.name === "string" ? city.name : "",
                description: typeof city?.description === "string" ? city.description : "",
                imageUrl: typeof city?.imageUrl === "string" ? city.imageUrl : "",
            } );
        }
    }
    return out;
}

function itemsFromCategory( data, key ) {
    const arr = Array.isArray( data?.[ key ] ) ? data[ key ] : [];
    const catLabel = key === "beaches" ? "Beach" : key === "temples" ? "Temple" : "Place";

    return arr.map( ( x ) => ( {
        category: catLabel,
        country: "",
        name: typeof x?.name === "string" ? x.name : "",
        description: typeof x?.description === "string" ? x.description : "",
        imageUrl: typeof x?.imageUrl === "string" ? x.imageUrl : "",
    } ) );
}

function allSearchableItems( data ) {
    return [
        ...citiesFromCountries( data ),
        ...itemsFromCategory( data, "temples" ),
        ...itemsFromCategory( data, "beaches" ),
    ];
}

/**
 * Task 8:
 * User keyword: beach, temple, country
 * - beach -> data.beaches
 * - temple -> data.temples
 * - country -> all cities inside countries
 * Fallback: general search across all items (name/description/country/category)
 */
function searchRecommendations( query, data ) {
    const q = normalize( query );

    if ( !q ) {
        return { items: [], message: "Please enter a valid search query." };
    }

    let items = [];

    if ( q.includes( "beach" ) ) {
        items = itemsFromCategory( data, "beaches" );
    } else if ( q.includes( "temple" ) ) {
        items = itemsFromCategory( data, "temples" );
    } else if ( q.includes( "country" ) ) {
        items = citiesFromCountries( data );
    } else {
        // Defensive full-text fallback (nice-to-have)
        const pool = allSearchableItems( data );
        items = pool.filter( ( it ) => {
            const hay = normalize(
                `${ it.name } ${ it.description } ${ it.country } ${ it.category }`
            );
            return hay.includes( q );
        } );
    }

    if ( !items || items.length === 0 ) {
        return { items: [], message: "No recommendations found." };
    }

    return { items, message: "" };
}

// ---------- UI (Results) ----------
let stylesInjected = false;
function injectResultStyles() {
    if ( stylesInjected ) return;
    stylesInjected = true;

    const css = `
    /* Results panel (right side like sample) */
    #tr-results-panel {
      position: absolute;
      top: 110px;
      right: 18px;
      width: min(560px, 42vw);
      max-height: calc(100% - 150px);
      overflow: auto;
      padding: 14px;
      border-radius: 14px;
      background: rgba(0,0,0,0.12);
      border: 1px solid rgba(255,255,255,0.10);
      backdrop-filter: blur(2px);
    }
    #tr-results-panel .tr-panel-topbar {
      height: 22px;
      border-radius: 12px;
      background: rgba(11,107,104,0.85);
      margin-bottom: 12px;
    }
    #tr-results-panel .tr-msg {
      color: rgba(255,255,255,0.92);
      font-weight: 700;
      font-size: 14px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(0,0,0,0.22);
      border: 1px solid rgba(255,255,255,0.12);
    }
    .tr-card {
      background: rgba(255,255,255,0.92);
      color: #0f2a2a;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(0,0,0,0.22);
      margin-bottom: 14px;
    }
    .tr-card img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      display: block;
    }
    .tr-card-body {
      padding: 12px 14px 14px;
    }
    .tr-card-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 900;
    }
    .tr-card-desc {
      margin: 0 0 12px 0;
      font-size: 13px;
      line-height: 1.45;
      color: rgba(15,42,42,0.82);
    }
    .tr-card-meta {
      font-size: 12px;
      font-weight: 800;
      color: rgba(15,42,42,0.70);
      margin-bottom: 8px;
    }
    .tr-visit {
      display: inline-block;
      border: none;
      cursor: pointer;
      padding: 8px 14px;
      border-radius: 10px;
      font-weight: 900;
      background: rgba(11,107,104,0.95);
      color: #ffffff;
    }
    .tr-visit:hover { background: rgba(10,95,92,0.95); }

    /* Mobile: panel becomes normal flow */
    @media (max-width: 980px) {
      #tr-results-panel {
        position: static;
        width: 100%;
        max-height: none;
        margin-top: 14px;
      }
    }
  `;

    const styleEl = document.createElement( "style" );
    styleEl.textContent = css;
    document.head.appendChild( styleEl );
}

function ensureResultsPanel() {
    injectResultStyles();

    let panel = document.getElementById( "tr-results-panel" );
    if ( panel ) return panel;

    const home = document.getElementById( "home" );
    if ( !home ) return null;

    panel = document.createElement( "div" );
    panel.id = "tr-results-panel";

    const topbar = document.createElement( "div" );
    topbar.className = "tr-panel-topbar";

    const body = document.createElement( "div" );
    body.id = "tr-results-body";

    panel.appendChild( topbar );
    panel.appendChild( body );

    // Home section is already position:relative via .splash in your CSS
    home.appendChild( panel );
    return panel;
}

function clearResultsUI() {
    const body = document.getElementById( "tr-results-body" );
    if ( body ) body.innerHTML = "";
}

function renderMessage( text ) {
    const panel = ensureResultsPanel();
    if ( !panel ) return;

    const body = document.getElementById( "tr-results-body" );
    if ( !body ) return;

    body.innerHTML = "";
    const p = document.createElement( "div" );
    p.className = "tr-msg";
    p.textContent = text;
    body.appendChild( p );
}

function createCard( item ) {
    const card = document.createElement( "article" );
    card.className = "tr-card";

    if ( item.imageUrl ) {
        const img = document.createElement( "img" );
        img.src = item.imageUrl; // Put your own images using these filenames/URLs in the JSON
        img.alt = item.name || "recommendation image";
        img.loading = "lazy";
        img.addEventListener( "error", () => img.remove() ); // fail gracefully
        card.appendChild( img );
    }

    const body = document.createElement( "div" );
    body.className = "tr-card-body";

    const meta = document.createElement( "div" );
    meta.className = "tr-card-meta";
    meta.textContent = item.country ? `${ item.category } • ${ item.country }` : item.category;

    const title = document.createElement( "h3" );
    title.className = "tr-card-title";
    title.textContent = item.name || "Untitled";

    const desc = document.createElement( "p" );
    desc.className = "tr-card-desc";
    desc.textContent = item.description || "";

    const btn = document.createElement( "button" );
    btn.className = "tr-visit";
    btn.type = "button";
    btn.textContent = "Visit";
    btn.addEventListener( "click", () => {
        console.log( "Visit clicked:", item );
    } );

    body.appendChild( meta );
    body.appendChild( title );
    body.appendChild( desc );
    body.appendChild( btn );

    card.appendChild( body );
    return card;
}

function renderResults( items ) {
    const panel = ensureResultsPanel();
    if ( !panel ) return;

    const body = document.getElementById( "tr-results-body" );
    if ( !body ) return;

    body.innerHTML = "";
    for ( const item of items ) body.appendChild( createCard( item ) );
}

// ---------- Wiring (Search + Clear) ----------
async function handleSearch() {
    try {
        const input = document.getElementById( "searchInput" );
        const query = input ? input.value : "";
        const data = await loadData();

        const { items, message } = searchRecommendations( query, data );
        if ( message ) return renderMessage( message );

        renderResults( items );
    } catch ( err ) {
        console.error( "❌ Search error:", err );
        renderMessage( "Something went wrong while loading recommendations." );
    }
}

function handleClear() {
    const input = document.getElementById( "searchInput" );
    if ( input ) input.value = "";
    clearResultsUI();
}

// ---------- Navbar note from earlier tasks (optional but useful) ----------
function updateNavbarSearchVisibility() {
    const navSearch = document.getElementById( "navSearchArea" );
    if ( !navSearch ) return;

    const hash = window.location.hash || "#home";
    const showSearch = hash === "#home" || hash === "#" || hash === "";
    navSearch.style.display = showSearch ? "" : "none";
}

document.addEventListener( "DOMContentLoaded", async () => {
    // Preload data once (Task 6 console.log happens here)
    try {
        await loadData();
    } catch ( e ) {
        console.error( "❌ Initial data load failed:", e );
    }

    // Hook up Search (button + Enter)
    const form = document.getElementById( "searchForm" );
    if ( form ) {
        form.addEventListener( "submit", ( e ) => {
            e.preventDefault();
            handleSearch();
        } );
    }

    const searchBtn = document.getElementById( "searchBtn" );
    if ( searchBtn ) searchBtn.addEventListener( "click", ( e ) => {
        e.preventDefault();
        handleSearch();
    } );

    // Hook up Clear
    const resetBtn = document.getElementById( "resetBtn" );
    if ( resetBtn ) resetBtn.addEventListener( "click", handleClear );

    // Navbar search visibility (About/Contact: hide search UI)
    updateNavbarSearchVisibility();
    window.addEventListener( "hashchange", updateNavbarSearchVisibility );

    // Contact form UI-only submit (if present)
    const contactForm = document.getElementById( "contactForm" );
    if ( contactForm ) {
        contactForm.addEventListener( "submit", ( e ) => {
            e.preventDefault();
            const name = document.getElementById( "nameInput" )?.value?.trim() || "";
            const email = document.getElementById( "emailInput" )?.value?.trim() || "";
            const message = document.getElementById( "messageInput" )?.value?.trim() || "";
            console.log( "Contact form submitted:", { name, email, message } );
            alert( "Thanks! Your message has been received." );
            contactForm.reset();
        } );

        // Task 9: Clear button logic (add/keep this in travel_recommendation.js)

        function clearUI() {
            // Clear search input
            const input = document.getElementById( "searchInput" );
            if ( input ) input.value = "";

            // Clear rendered results
            const resultsBody = document.getElementById( "tr-results-body" );
            if ( resultsBody ) resultsBody.innerHTML = "";
        }

        // Wire Clear button
        document.addEventListener( "DOMContentLoaded", () => {
            const clearBtn = document.getElementById( "resetBtn" );
            if ( clearBtn ) clearBtn.addEventListener( "click", clearUI );
        } );
        // Task 10 (Optional): Country date/time display (add to travel_recommendation.js)

        // Map destinations/countries to IANA time zones (extend as needed)
        const TIMEZONE_MAP = {
            // Cities
            "sydney": "Australia/Sydney",
            "melbourne": "Australia/Melbourne",
            "tokyo": "Asia/Tokyo",
            "kyoto": "Asia/Tokyo",
            "new york": "America/New_York",
            "toronto": "America/Toronto",

            // Countries (fallbacks)
            "australia": "Australia/Sydney",
            "japan": "Asia/Tokyo",
            "usa": "America/New_York",
            "united states": "America/New_York",
            "canada": "America/Toronto",
            "brazil": "America/Sao_Paulo",
            "india": "Asia/Kolkata",
        };

        // Return a time string for the matched timezone, or empty string if unknown
        function getLocalTimeForPlace( placeText ) {
            const key = String( placeText || "" ).toLowerCase();

            // Find a matching key in TIMEZONE_MAP
            const tzKey = Object.keys( TIMEZONE_MAP ).find( ( k ) => key.includes( k ) );
            if ( !tzKey ) return "";

            const timeZone = TIMEZONE_MAP[ tzKey ];
            const options = {
                timeZone,
                hour12: true,
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
            };

            return new Date().toLocaleTimeString( "en-US", options );
        }

        /**
         * Optional: Show time inside each recommendation card.
         * - Call this from createCard(item) when rendering results.
         */
        function buildTimeBadge( item ) {
            // Try using city name first, then country name
            const placeCandidate = item?.name || item?.country || "";
            const t = getLocalTimeForPlace( placeCandidate );
            if ( !t ) return null;

            const badge = document.createElement( "div" );
            badge.style.marginBottom = "8px";
            badge.style.fontSize = "12px";
            badge.style.fontWeight = "800";
            badge.style.opacity = "0.8";
            badge.textContent = `Local time: ${ t }`;
            return badge;
        }

        // Example integration (inside your existing createCard(item) function):
        // const timeBadge = buildTimeBadge(item);
        // if (timeBadge) body.appendChild(timeBadge);

        // Optional: Also log time to console for the first two results after search:
        function logTimesForTopResults( items ) {
            ( items || [] ).slice( 0, 2 ).forEach( ( it ) => {
                const t = getLocalTimeForPlace( it?.name || it?.country || "" );
                if ( t ) console.log( `🕒 Current time for "${ it.name }":`, t );
            } );
        }

        // Example call (inside handleSearch after you get items):
        // logTimesForTopResults(items);


    }
} );
