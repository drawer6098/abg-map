let map;
let countiesLayer;

// Initialize the map
function initMap() {
    map = L.map('map').setView([37.8, -96], 4); // Center on the US
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Load GeoJSON data
    fetch('data.geojson')
        .then(response => response.json())
        .then(data => drawCounties(data));
}

// Draw counties with color based on age range
function drawCounties(data) {
    if (countiesLayer) countiesLayer.remove(); // Clear old data

    countiesLayer = L.geoJSON(data, {
        style: { color: '#444', weight: 0.5 },
        onEachFeature: (feature, layer) => {
            // Get age range from user input
            const minAge = parseInt(document.getElementById('minAge').value);
            const maxAge = parseInt(document.getElementById('maxAge').value);
            
            // Calculate percentage (precomputed in GeoJSON)
            const total = feature.properties.total;
            const selected = feature.properties[`ages_${minAge}_${maxAge}`];
            const percentage = total === 0 ? 0 : (selected / total * 100).toFixed(1);

            // Color the county
            layer.setStyle({
                fillColor: getColor(percentage),
                fillOpacity: 0.7
            });

            // Show data on click
            layer.on('click', () => {
                layer.bindPopup(`
                    <b>${feature.properties.name}</b><br>
                    Asian Females (${minAge}-${maxAge}): ${selected}<br>
                    Percentage: ${percentage}%
                `).openPopup();
            });
        }
    }).addTo(map);
}

// Assign colors based on percentage
function getColor(percentage) {
    return percentage > 20 ? '#800026' :
           percentage > 15 ? '#BD0026' :
           percentage > 10 ? '#E31A1C' :
           percentage > 5  ? '#FC4E2A' :
           percentage > 0  ? '#FD8D3C' :
                              '#FFFFFF';
}

// Update the map when the button is clicked
function updateMap() {
    fetch('data.geojson')
        .then(response => response.json())
        .then(data => drawCounties(data));
}

// Start the map
initMap();
