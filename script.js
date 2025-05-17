let map;
let geojsonLayer;
let allData; // Store original data

// Color scale generator
const colorScale = (value) => {
  return chroma.scale(['#f0f9ff', '#cce5ff', '#99ccff', '#66b3ff', '#3399ff', '#0080ff'])
    .domain([0, 0.2, 0.4, 0.6, 1])(value);
};

async function initMap() {
    map = L.map('map', {
        preferCanvas: true,
        zoomControl: false
    }).setView([37.8, -96], 4);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    try {
        const response = await fetch('data.geojson');
        allData = await response.json();
        drawCounties(allData); // Initial draw with default range
        addLegend();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function drawCounties(data) {
    if (geojsonLayer) geojsonLayer.remove();
    
    // Get current age range
    const minAge = parseInt(document.getElementById('minAge').value);
    const maxAge = parseInt(document.getElementById('maxAge').value);

    geojsonLayer = L.geoJSON(data, {
        style: (feature) => getStyle(feature, minAge, maxAge),
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const total = props.Total_Asian_Females || 0;
            const selected = calculateSelected(props, minAge, maxAge);
            
            layer.bindPopup(`
                <b>${props.NAME}</b><br>
                Total Asian Females: ${total}<br>
                Selected Age Range (${minAge}-${maxAge}): ${selected}
            `);
        }
    }).addTo(map);
}

function calculateSelected(properties, minAge, maxAge) {
    // Define age group columns in your data
    const ageGroups = {
        '18-19': '18 and 19 years',
        '20-24': '20 to 24 years',
        '25-29': '25 to 29 years',
        '30-34': '30 to 34 years',
        '35-44': '35 to 44 years',
        '45-54': '45 to 54 years',
        '55-64': '55 to 64 years'
    };

    // Find matching age groups
    let sum = 0;
    Object.entries(ageGroups).forEach(([range, field]) => {
        const [groupMin, groupMax] = range.split('-').map(Number);
        if (groupMax >= minAge && groupMin <= maxAge) {
            sum += parseInt(properties[field]) || 0;
        }
    });
    
    return sum;
}

function getStyle(feature, minAge, maxAge) {
    const total = feature.properties.Total_Asian_Females || 1; // Avoid division by zero
    const selected = calculateSelected(feature.properties, minAge, maxAge);
    const percentage = selected / total;

    return {
        fillColor: colorScale(percentage),
        weight: 0.5,
        opacity: 1,
        color: '#333', // Darker border for better contrast
        fillOpacity: 0.8 // Slightly more opaque
    };
}

function updateMap() {
    drawCounties(allData); // Redraw with current age range
}

function addLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.innerHTML = `
            <h4 style="margin:0 0 5px 0; font-size:14px;">% in Selected Age Range</h4>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width:20px; height:20px; background:${colorScale(0)}"></div>
                    <span>0%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width:20px; height:20px; background:${colorScale(0.25)}"></div>
                    <span>25%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width:20px; height:20px; background:${colorScale(0.5)}"></div>
                    <span>50%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width:20px; height:20px; background:${colorScale(0.75)}"></div>
                    <span>75%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width:20px; height:20px; background:${colorScale(1)}"></div>
                    <span>100%</span>
                </div>
            </div>
        `;
        return div;
    };
    legend.addTo(map);
}

// Initialize map
initMap();
