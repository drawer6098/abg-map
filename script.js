let map;
let geojsonLayer;
let allData; // Store original data

const AGE_GROUPS = {
    '18-19': '18 and 19 years',
    '20-24': '20 to 24 years',
    '25-29': '25 to 29 years',
    '30-34': '30 to 34 years',
    '35-44': '35 to 44 years',
    '45-54': '45 to 54 years',
    '55-64': '55 to 64 years'
};

function calculateTotalAsianFemales(properties) {
    return Object.values(AGE_GROUPS).reduce((sum, field) => {
        return sum + (parseInt(properties[field]) || 0);
    }, 0);
}

// Discrete color scale with explicit range mapping
const getColor = (percentage) => {
  if (percentage >= 0.07) return '#003366';     // 7-14% (Dark Navy)
  else if (percentage >= 0.03) return '#004C99';  // 3-7%
  else if (percentage >= 0.01) return '#0066CC';   // 1-3%
  else if (percentage >= 0.005) return '#3385FF';  // 0.5-1%
  else if (percentage >= 0.0025) return '#99C2FF'; // 0.25-0.5%
  else if (percentage > 0) return '#E6F0FF';       // 0-0.25%
  return '#F8F9FA';                               // 0% (Light Gray)
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
    
    const minAge = parseInt(document.getElementById('minAge').value);
    const maxAge = parseInt(document.getElementById('maxAge').value);

    geojsonLayer = L.geoJSON(data, {
        style: (feature) => getStyle(feature, minAge, maxAge),
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const totalPopulation = props.Total || 0;
            const totalAsianFemales = calculateTotalAsianFemales(props);
            const selected = calculateSelected(props, minAge, maxAge);
            
            layer.bindPopup(`
                <b>${props.NAME}</b><br>
                Total ABGs: ${totalAsianFemales.toLocaleString()}<br>
                Selected Age Range (${minAge}-${maxAge}): ${selected.toLocaleString()}<br>
                Percentage of ABGs: ${totalPopulation === 0 ? '0.0%' : ((selected / totalPopulation * 100).toFixed(1)) + '%'}
            `);
        }
    }).addTo(map);
}

function calculateSelected(properties, minAge, maxAge) {
    // Define age group columns in your data
    const ageGroups = AGE_GROUPS;

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
  const totalPopulation = feature.properties.Total || 0;
  const selected = calculateSelected(feature.properties, minAge, maxAge);
  
  if (totalPopulation === 0) return {
    fillColor: '#f0f0f0',
    weight: 0.5,
    color: '#999',
    fillOpacity: 0.7
  };

  const percentage = selected / totalPopulation;
  
  return {
    fillColor: getColor(percentage),
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
    div.style.fontFamily = "'Noto Sans', sans-serif";
    
    div.innerHTML = `
      <h4 style="margin:0 0 5px 0; font-size:14px; font-family: 'Noto Sans', sans-serif; font-weight: 700">
        % of Total Population
      </h4>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#F8F9FA"></div>
          <span style="font-family: 'Noto Sans', sans-serif">0%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#E6F0FF"></div>
          <span style="font-family: 'Noto Sans', sans-serif">0-0.25%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#99C2FF"></div>
          <span style="font-family: 'Noto Sans', sans-serif">0.25-0.5%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#3385FF"></div>
          <span style="font-family: 'Noto Sans', sans-serif">0.5-1%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#0066CC"></div>
          <span style="font-family: 'Noto Sans', sans-serif">1-3%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#004C99"></div>
          <span style="font-family: 'Noto Sans', sans-serif">3-7%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width:24px; height:24px; background:#003366"></div>
          <span style="font-family: 'Noto Sans', sans-serif">7-14%</span>
        </div>
      </div>
    `;
    return div;
  };
  legend.addTo(map);
}

// Initialize map
initMap();
