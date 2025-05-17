let map;
let geojsonLayer;
let allData; // Store original data

// Discrete color scale with explicit range mapping
const getColor = (percentage) => {
  if (percentage >= 0.12) return '#0080ff';      // 12-15%
  else if (percentage >= 0.09) return '#3399ff';  // 9-12%
  else if (percentage >= 0.06) return '#66b3ff';  // 6-9%
  else if (percentage >= 0.03) return '#99ccff';  // 3-6%
  else if (percentage > 0) return '#cce5ff';      // 0-3%
  return '#f0f9ff';                              // 0%
};

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
  
  if (total === 0) return {
    fillColor: '#f0f0f0',
    weight: 0.5,
    color: '#999',
    fillOpacity: 0.7
  };

  const percentage = selected / total;
  
  return {
    fillColor: getColor(percentage),  // Use discrete color function
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
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width:20px; height:20px; background:#f0f9ff"></div>
          <span>0%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width:20px; height:20px; background:#cce5ff"></div>
          <span>0-3%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width:20px; height:20px; background:#99ccff"></div>
          <span>3-6%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width:20px; height:20px; background:#66b3ff"></div>
          <span>6-9%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width:20px; height:20px; background:#3399ff"></div>
          <span>9-12%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width:20px; height:20px; background:#0080ff"></div>
          <span>12-15%</span>
        </div>
      </div>
    `;
    return div;
  };
  legend.addTo(map);
}

// Initialize map
initMap();
