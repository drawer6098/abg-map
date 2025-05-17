let map;
let geojsonLayer;
let allData; // Store original data

// Color scale generator
const colorScale = (value) => {
  return chroma.scale(['#f0f9ff', '#cce5ff', '#99ccff', '#66b3ff', '#3399ff', '#0080ff'])
    .domain([0, 0.03, 0.06, 0.09, 0.12, 0.15])(value);
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
        
        // Calculate overlap between selected range and group range
        const overlapMin = Math.max(minAge, groupMin);
        const overlapMax = Math.min(maxAge, groupMax);
        
        // Only count if valid overlap
        if (overlapMin <= overlapMax) {
            const groupValue = parseInt(properties[field]) || 0;
            sum += groupValue;
        }
    });
    
    return sum;
}

function getStyle(feature, minAge, maxAge) {
    const total = feature.properties.Total_Asian_Females || 0;
    const selected = calculateSelected(feature.properties, minAge, maxAge);
    
    // Handle zero total case
    if (total === 0) return {
        fillColor: '#f0f0f0',
        weight: 0.5,
        color: '#999',
        fillOpacity: 0.7
    };

    const percentage = selected / total;
    
    return {
        fillColor: colorScale(percentage),
        weight: 0.5,
        color: '#333',
        fillOpacity: 0.7
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
        ${createLegendItems().join('')}
      </div>
    `;
    return div;
  };
  legend.addTo(map);
}

// Helper to create legend items for 5 intervals
function createLegendItems() {
  const intervals = [
    { min: 0, max: 3, mid: 0.015 },
    { min: 3, max: 6, mid: 0.045 },
    { min: 6, max: 9, mid: 0.075 },
    { min: 9, max: 12, mid: 0.105 },
    { min: 12, max: 15, mid: 0.135 }
  ];

  return intervals.map(interval => `
    <div style="display: flex; align-items: center; gap: 5px;">
      <div style="width:20px; height:20px; background:${colorScale(interval.mid)}"></div>
      <span>${interval.min}%-${interval.max}%</span>
    </div>
  `);
}

// Initialize map
initMap();
