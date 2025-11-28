// Global variables
let map;
let layers = {
    comercios: null,
    sectores: null,
    manzanas: null,
    lotes: null
};
let allComerciosData = [];
let filteredComerciosData = [];
let charts = {
    activity: null
};
let measureMode = false;
let measureMarkers = [];
let measureLine = null;
let initialBounds = null;

// Color schemes - Floor colors
const pisoColors = {
    '01': '#FF0000',  // Rojo (Red)
    '02': '#FFFF00',  // Amarillo (Yellow)
    '03': '#00FF00',  // Verde (Green)
    '04': '#00FFFF',  // Cyan
    '05': '#0000FF',  // Azul (Blue)
    '06': '#FFC0CB',  // Rosado (Pink)
    '07': '#FFA500',  // Naranja (Orange)
    '08': '#800080',  // Morado (Purple)
    '09': '#8B00FF',  // Violeta (Violet)
    '10': '#9370DB',  // Púrpura (Purple)
    '11': '#4B0082',  // Violeta azulado (Blue-Violet/Indigo)
    '12': '#C71585',  // Violeta rojizo (Red-Violet/Medium Violet Red)
    '71': '#8B4513',  // Marrón (Brown)
    '81': '#90EE90',  // Verde claro (Light Green)
    '82': '#98FB98',  // Verde tenue (Pale Green)
    '83': '#AFEEAF'   // Verde más tenue (Very Pale Green)
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadData();
    setupEventListeners();
    setupZoomControl();
});




// Initialize Leaflet map
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: true
    }).setView([-13.5283, -71.9572], 14);

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 28
    }).addTo(map);
}

// Load GeoJSON data
function loadData() {
    try {
        // Load layers
        loadSectores();
        loadManzanas();
        loadLotes();
        loadComercios();

        // Hide loading overlay
        setTimeout(() => {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }, 1000);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error al cargar los datos. Por favor, recarga la página.');
    }
}

// Load Sectores layer
function loadSectores() {
    layers.sectores = L.geoJSON(tg_sector, {
        style: {
            fillColor: '#9b59b6',
            fillOpacity: 0.2,
            color: '#9b59b6',
            weight: 2,
            opacity: 0.8
        },
        onEachFeature: (feature, layer) => {
            // Add label
            const center = layer.getBounds().getCenter();
            const label = L.marker(center, {
                icon: L.divIcon({
                    className: 'sector-label',
                    html: `<div style="color: #9b59b6; font-weight: 900; font-size: 17px; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 4px #fff, 0 0 4px #fff;">${feature.properties.cod_sector}</div>`,
                    iconSize: [60, 24]
                })
            });

            layer.label = label;
            layer.label.labelType = 'sector';
            label.addTo(map);
        }
    }).addTo(map);
}

// Load Manzanas layer
function loadManzanas() {
    layers.manzanas = L.geoJSON(tg_manzana, {
        style: {
            fillColor: '#3498db',
            fillOpacity: 0.15,
            color: '#3498db',
            weight: 1.5,
            opacity: 0.6
        },
        onEachFeature: (feature, layer) => {
            // Add label
            const center = layer.getBounds().getCenter();
            const label = L.marker(center, {
                icon: L.divIcon({
                    className: 'manzana-label',
                    html: `<div style="color: #3498db; font-weight: 900; font-size: 14px; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 4px #fff, 0 0 4px #fff;">${feature.properties.cod_mzna}</div>`,
                    iconSize: [50, 18]
                })
            });

            layer.label = label;
            layer.label.labelType = 'manzana';
            label.addTo(map);
        }
    }).addTo(map);
}

// Load Lotes layer
function loadLotes() {
    layers.lotes = L.geoJSON(tg_lote, {
        style: {
            fillColor: '#2c3e50',
            fillOpacity: 0.1,
            color: '#2c3e50',
            weight: 1,
            opacity: 0.5
        },
        onEachFeature: (feature, layer) => {
            // Add label to all lotes
            const center = layer.getBounds().getCenter();
            const label = L.marker(center, {
                icon: L.divIcon({
                    className: 'lote-label',
                    html: `<div style="color: #000; font-weight: 900; font-size: 12px; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 4px #fff, 0 0 4px #fff;">${feature.properties.cod_lote}</div>`,
                    iconSize: [40, 16]
                })
            });

            layer.label = label;
            layer.label.labelType = 'lote';
            label.addTo(map);
        }
    }).addTo(map);
}

// Load Comercios layer
function loadComercios() {
    allComerciosData = tg_comercio.features;
    filteredComerciosData = [...allComerciosData];

    layers.comercios = L.geoJSON(tg_comercio, {
        style: (feature) => {
            const piso = feature.properties.codi_piso;
            return {
                fillColor: pisoColors[piso] || '#95a5a6',
                fillOpacity: 0.7,
                color: '#fff',
                weight: 1,
                opacity: 1
            };
        },
        onEachFeature: (feature, layer) => {
            // Create popup
            const props = feature.properties;
            const popupContent = `
                <div class="popup-content">
                    <h3><i class="fas fa-store"></i> ${props.desc_actividad}</h3>
                    <div class="popup-row">
                        <span class="popup-label">Código Actividad:</span>
                        <span class="popup-value">${props.codi_actividad}</span>
                    </div>

                    <div class="popup-row vertical">
                        <span class="popup-label">Referencia Catastral:</span>
                        <span class="popup-value highlight-value">${props.id_uni_cat}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Piso:</span>
                        <span class="popup-value">${props.codi_piso}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Área Gráfica:</span>
                        <span class="popup-value">${props.area_grafica} m²</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Ficha Económica:</span>
                        <span class="popup-value">${props.nume_ficha}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Fecha de Levantamiento:</span>
                        <span class="popup-value">${props.fecha_levantamiento}</span>
                    </div>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    // Fit map to comercios bounds
    if (layers.comercios.getBounds().isValid()) {
        initialBounds = layers.comercios.getBounds();
        map.fitBounds(initialBounds);
    }

    // Update statistics and charts
    updateStatistics();
    populateFilters();
    createCharts();
}

// Helper function to aggregate data by nume_ficha
function aggregateData(features) {
    const aggregated = {};

    features.forEach(feature => {
        const props = feature.properties;
        const ficha = props.nume_ficha;

        if (!aggregated[ficha]) {
            aggregated[ficha] = {
                nume_ficha: ficha,
                area_grafica: 0,
                codi_piso: new Set(),
                desc_actividad: new Set(),
                codi_actividad: new Set(),
                codi_lote: new Set()
            };
        }

        // Sum area
        aggregated[ficha].area_grafica += (parseFloat(props.area_grafica) || 0);

        // Collect other fields
        if (props.codi_piso) aggregated[ficha].codi_piso.add(props.codi_piso);
        if (props.desc_actividad) aggregated[ficha].desc_actividad.add(props.desc_actividad);
        if (props.codi_actividad) aggregated[ficha].codi_actividad.add(props.codi_actividad);
        if (props.codi_lote) aggregated[ficha].codi_lote.add(props.codi_lote);
    });

    // Convert Sets to strings and format
    return Object.values(aggregated).map(item => ({
        nume_ficha: item.nume_ficha,
        area_grafica: parseFloat(item.area_grafica.toFixed(2)),
        codi_piso: Array.from(item.codi_piso).sort().join(', '),
        desc_actividad: Array.from(item.desc_actividad).sort().join(', '),
        codi_actividad: Array.from(item.codi_actividad).sort().join(', '),
        codi_lote: Array.from(item.codi_lote).sort().join(', ')
    }));
}

// Update statistics
function updateStatistics() {
    const aggregatedAll = aggregateData(allComerciosData);
    const aggregatedFiltered = aggregateData(filteredComerciosData);

    document.getElementById('totalComercios').textContent = aggregatedAll.length;
    document.getElementById('filteredComercios').textContent = aggregatedFiltered.length;
}

// Populate filter dropdowns
function populateFilters() {
    const activities = new Set();
    const pisos = new Set();

    allComerciosData.forEach(feature => {
        activities.add(feature.properties.desc_actividad);
        pisos.add(feature.properties.codi_piso);
    });

    // Populate activity filter
    const activityFilter = document.getElementById('activityFilter');
    Array.from(activities).sort().forEach(activity => {
        const option = document.createElement('option');
        option.value = activity;
        option.textContent = activity;
        activityFilter.appendChild(option);
    });

    // Populate piso filter
    const pisoFilter = document.getElementById('pisoFilter');
    Array.from(pisos).sort().forEach(piso => {
        const option = document.createElement('option');
        option.value = piso;
        option.textContent = `Piso ${piso}`;
        pisoFilter.appendChild(option);
    });
}

// Create charts
function createCharts() {
    const aggregatedData = aggregateData(filteredComerciosData);
    createActivityChart(aggregatedData);
}

// Create top activities chart
function createActivityChart(data) {
    const activityCount = {};
    data.forEach(item => {
        const activity = item.desc_actividad;
        activityCount[activity] = (activityCount[activity] || 0) + 1;
    });

    // Get top 10 activities
    const sortedActivities = Object.entries(activityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctx = document.getElementById('activityChart').getContext('2d');

    if (charts.activity) {
        charts.activity.destroy();
    }

    charts.activity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedActivities.map(a => a[0]),
            datasets: [{
                label: 'Cantidad',
                data: sortedActivities.map(a => a[1]),
                backgroundColor: '#DC143C',
                borderColor: '#B01030',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(22, 33, 62, 0.95)',
                    titleColor: '#DC143C',
                    bodyColor: '#ffffff',
                    borderColor: '#DC143C',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#b0b3b8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#b0b3b8',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Apply filters
function applyFilters() {
    const activityValue = document.getElementById('activityFilter').value;
    const pisoValue = document.getElementById('pisoFilter').value;

    filteredComerciosData = allComerciosData.filter(feature => {
        const matchActivity = !activityValue || feature.properties.desc_actividad === activityValue;
        const matchPiso = !pisoValue || feature.properties.codi_piso === pisoValue;
        return matchActivity && matchPiso;
    });

    // Update layer
    if (layers.comercios) {
        map.removeLayer(layers.comercios);
    }

    layers.comercios = L.geoJSON({
        type: 'FeatureCollection',
        features: filteredComerciosData
    }, {
        style: (feature) => {
            const piso = feature.properties.codi_piso;
            return {
                fillColor: pisoColors[piso] || '#95a5a6',
                fillOpacity: 0.7,
                color: '#fff',
                weight: 1,
                opacity: 1
            };
        },
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const popupContent = `
                <div class="popup-content">
                    <h3><i class="fas fa-store"></i> ${props.desc_actividad}</h3>
                    <div class="popup-row">
                        <span class="popup-label">Código Actividad:</span>
                        <span class="popup-value">${props.codi_actividad}</span>
                    </div>

                    <div class="popup-row vertical">
                        <span class="popup-label">Referencia Catastral:</span>
                        <span class="popup-value highlight-value">${props.id_uni_cat}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Piso:</span>
                        <span class="popup-value">${props.codi_piso}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Área Gráfica:</span>
                        <span class="popup-value">${props.area_grafica} m²</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Ficha Económica:</span>
                        <span class="popup-value">${props.nume_ficha}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Fecha de Levantamiento:</span>
                        <span class="popup-value">${props.fecha_levantamiento}</span>
                    </div>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    // Update statistics and charts
    updateStatistics();
    createCharts();
}

// Clear filters
function clearFilters() {
    document.getElementById('activityFilter').value = '';
    document.getElementById('pisoFilter').value = '';
    applyFilters();
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const showBtn = document.getElementById('showSidebar');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        showBtn.style.display = 'flex';
    });

    showBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        showBtn.style.display = 'none';
    });

    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Layer toggles
    document.getElementById('layerComercios').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(layers.comercios);
        } else {
            map.removeLayer(layers.comercios);
        }
    });

    document.getElementById('layerSectores').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(layers.sectores);
            layers.sectores.eachLayer(layer => {
                if (layer.label) layer.label.addTo(map);
            });
        } else {
            map.removeLayer(layers.sectores);
            layers.sectores.eachLayer(layer => {
                if (layer.label) map.removeLayer(layer.label);
            });
        }
    });

    document.getElementById('layerManzanas').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(layers.manzanas);
            layers.manzanas.eachLayer(layer => {
                if (layer.label) layer.label.addTo(map);
            });
        } else {
            map.removeLayer(layers.manzanas);
            layers.manzanas.eachLayer(layer => {
                if (layer.label) map.removeLayer(layer.label);
            });
        }
    });

    document.getElementById('layerLotes').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(layers.lotes);
            layers.lotes.eachLayer(layer => {
                if (layer.label) layer.label.addTo(map);
            });
        } else {
            map.removeLayer(layers.lotes);
            layers.lotes.eachLayer(layer => {
                if (layer.label) map.removeLayer(layer.label);
            });
        }
    });

    // Map controls
    document.getElementById('zoomIn').addEventListener('click', () => {
        map.zoomIn();
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        map.zoomOut();
    });

    document.getElementById('zoomHome').addEventListener('click', () => {
        if (initialBounds) {
            map.fitBounds(initialBounds);
        }
    });

    document.getElementById('measureBtn').addEventListener('click', toggleMeasure);

    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.querySelector('#fullscreenBtn i').className = 'fas fa-compress';
        } else {
            document.exitFullscreen();
            document.querySelector('#fullscreenBtn i').className = 'fas fa-expand';
        }
    });
}

// Toggle measure mode
function toggleMeasure() {
    measureMode = !measureMode;
    const btn = document.getElementById('measureBtn');

    if (measureMode) {
        btn.classList.add('active');
        map.getContainer().style.cursor = 'crosshair';
        map.on('click', addMeasurePoint);
    } else {
        btn.classList.remove('active');
        map.getContainer().style.cursor = '';
        map.off('click', addMeasurePoint);
        clearMeasure();
    }
}

// Add measure point
function addMeasurePoint(e) {
    const marker = L.marker(e.latlng, {
        icon: L.divIcon({
            className: 'measure-marker',
            html: '<div style="background: #DC143C; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff;"></div>',
            iconSize: [10, 10]
        })
    }).addTo(map);

    measureMarkers.push(marker);

    if (measureMarkers.length > 1) {
        const latlngs = measureMarkers.map(m => m.getLatLng());

        if (measureLine) {
            map.removeLayer(measureLine);
        }

        measureLine = L.polyline(latlngs, {
            color: '#DC143C',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 5'
        }).addTo(map);

        // Calculate distance
        let totalDistance = 0;
        for (let i = 0; i < latlngs.length - 1; i++) {
            totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
        }

        const distanceText = totalDistance > 1000
            ? `${(totalDistance / 1000).toFixed(2)} km`
            : `${totalDistance.toFixed(2)} m`;

        marker.bindPopup(`<strong>Distancia:</strong> ${distanceText}`).openPopup();
    }
}

// Clear measure
function clearMeasure() {
    measureMarkers.forEach(marker => map.removeLayer(marker));
    measureMarkers = [];

    if (measureLine) {
        map.removeLayer(measureLine);
        measureLine = null;
    }
}

// Setup zoom control for labels
function setupZoomControl() {
    map.on('zoomend', updateLabelsVisibility);
    // Initial update
    updateLabelsVisibility();
}

// Update labels visibility based on zoom level
function updateLabelsVisibility() {
    const zoom = map.getZoom();

    // Iterate through all layers and update label visibility
    [layers.sectores, layers.manzanas, layers.lotes].forEach(layerGroup => {
        if (layerGroup) {
            layerGroup.eachLayer(layer => {
                if (layer.label) {
                    const labelType = layer.label.labelType;
                    let shouldShow = false;

                    // Determine visibility based on zoom and label type
                    if (labelType === 'sector' && zoom < 16) {
                        shouldShow = true;
                    } else if (labelType === 'manzana' && zoom >= 16 && zoom < 18) {
                        shouldShow = true;
                    } else if (labelType === 'lote' && zoom >= 18) {
                        shouldShow = true;
                    }

                    // Show or hide the label
                    if (shouldShow && !map.hasLayer(layer.label)) {
                        layer.label.addTo(map);
                    } else if (!shouldShow && map.hasLayer(layer.label)) {
                        map.removeLayer(layer.label);
                    }
                }
            });
        }
    });
}

