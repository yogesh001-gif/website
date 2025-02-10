// Global variables
let map;
let markers = [];
let currentPosition;

// Initialize the map
function initMap() {
    try {
        // Default to Delhi's center coordinates
        const defaultLocation = [28.6139, 77.2090];
        
        // Create the map
        map = L.map('map').setView(defaultLocation, 11);

        // Add the OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: ' OpenStreetMap contributors'
        }).addTo(map);

        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentPosition = [position.coords.latitude, position.coords.longitude];
                    map.setView(currentPosition, 13);
                    
                    // Add a marker for user's location
                    L.circleMarker(currentPosition, {
                        radius: 8,
                        fillColor: '#4285F4',
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(map).bindPopup('Your Location');
                    
                    loadNearbyStores();
                },
                (error) => {
                    console.log('Error getting location:', error);
                    loadNearbyStores(defaultLocation);
                }
            );
        } else {
            console.log('Geolocation is not supported by this browser.');
            loadNearbyStores(defaultLocation);
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = 
            '<div class="alert alert-warning">Unable to load map. Please check your internet connection and try again.</div>';
    }
}

// Initialize event listeners
function initEventListeners() {
    const searchInput = document.getElementById('medicine-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchMedicines();
            }
        });
    }
}

// Search for medicines
async function searchMedicines() {
    const query = document.getElementById('medicine-search').value;
    if (!query) return;

    try {
        const response = await fetch(`/api/medicines/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        displaySearchResults(data);
    } catch (error) {
        console.error('Error searching medicines:', error);
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to search medicines. Please try again.
                </div>
            </div>
        `;
    }
}

// Display search results
function displaySearchResults(medicines) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (!medicines || medicines.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No medicines found matching your search.
                </div>
            </div>
        `;
        return;
    }

    medicines.forEach(medicine => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="medicine-card">
                <h5>${medicine.name}</h5>
                <p class="text-muted">${medicine.genericName || ''}</p>
                <p class="price">₹${medicine.price}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge ${medicine.prescription ? 'bg-warning' : 'bg-success'}">
                        ${medicine.prescription ? 'Prescription Required' : 'OTC Medicine'}
                    </span>
                    <button class="btn btn-primary btn-sm" onclick="showMedicineDetails('${medicine._id}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

// Load nearby stores
async function loadNearbyStores(location = currentPosition) {
    if (!location) return;

    try {
        const response = await fetch(`/api/stores/nearby?lat=${location[0]}&lng=${location[1]}`);
        const stores = await response.json();
        displayStores(stores);
    } catch (error) {
        console.error('Error loading nearby stores:', error);
        const storeList = document.getElementById('store-list');
        storeList.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Unable to load nearby stores. Please try again later.
            </div>
        `;
    }
}

// Display stores on map and in list
function displayStores(stores) {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const storeList = document.getElementById('store-list');
    storeList.innerHTML = '';

    if (!stores || stores.length === 0) {
        storeList.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                No medical stores found in your area.
            </div>
        `;
        return;
    }

    const bounds = L.latLngBounds();

    stores.forEach((store, index) => {
        const position = [store.location.coordinates[1], store.location.coordinates[0]];
        bounds.extend(position);

        // Create custom icon
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-number">${index + 1}</div>`,
            iconSize: [30, 30]
        });

        // Add marker to map
        const marker = L.marker(position, { icon }).addTo(map);

        // Add popup
        const popupContent = `
            <div class="store-info-window">
                <h5>${store.name}</h5>
                <p><i class="fas fa-map-marker-alt"></i> ${store.address}</p>
                <p><i class="fas fa-phone"></i> ${store.phone}</p>
                ${store.is24Hours ? '<span class="badge bg-success">24 Hours</span>' : ''}
            </div>
        `;
        marker.bindPopup(popupContent);

        markers.push(marker);

        // Add to store list
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        storeCard.innerHTML = `
            <div class="store-number">${index + 1}</div>
            <h5>${store.name}</h5>
            <p><i class="fas fa-map-marker-alt"></i> ${store.address}</p>
            <p><i class="fas fa-phone"></i> ${store.phone}</p>
            ${store.is24Hours ? '<span class="badge bg-success">24 Hours</span>' : ''}
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="showDirections(${position[0]}, ${position[1]})">
                <i class="fas fa-directions"></i> Get Directions
            </button>
        `;

        // Add hover effect
        storeCard.addEventListener('mouseenter', () => {
            marker.openPopup();
        });
        storeCard.addEventListener('mouseleave', () => {
            marker.closePopup();
        });

        storeList.appendChild(storeCard);
    });

    // Fit map to show all markers
    map.fitBounds(bounds, { padding: [50, 50] });
}

// Show directions to store
function showDirections(lat, lng) {
    if (!currentPosition) {
        alert('Please allow location access to get directions.');
        return;
    }
    
    const url = `https://www.openstreetmap.org/directions?from=${currentPosition[0]},${currentPosition[1]}&to=${lat},${lng}`;
    window.open(url, '_blank');
}

// Show medicine details
async function showMedicineDetails(medicineId) {
    try {
        const response = await fetch(`/api/medicines/${medicineId}`);
        const medicine = await response.json();
        
        const modalBody = document.querySelector('#medicineModal .modal-body');
        modalBody.innerHTML = `
            <div class="medicine-details">
                <div class="medicine-header">
                    <h3 class="medicine-name">${medicine.name}</h3>
                    <span class="badge ${medicine.prescription ? 'bg-warning' : 'bg-success'} mb-2">
                        ${medicine.prescription ? 'Prescription Required' : 'Over The Counter'}
                    </span>
                </div>

                <div class="medicine-info-grid">
                    <div class="info-item">
                        <h5><i class="fas fa-capsules"></i> Generic Name</h5>
                        <p>${medicine.genericName || 'N/A'}</p>
                    </div>

                    <div class="info-item">
                        <h5><i class="fas fa-tags"></i> Category</h5>
                        <p>${medicine.category || 'N/A'}</p>
                    </div>

                    <div class="info-item">
                        <h5><i class="fas fa-industry"></i> Manufacturer</h5>
                        <p>${medicine.manufacturer || 'N/A'}</p>
                    </div>

                    <div class="info-item">
                        <h5><i class="fas fa-rupee-sign"></i> Price</h5>
                        <p class="price">₹${medicine.price.toFixed(2)} per ${medicine.unit || 'strip'}</p>
                    </div>
                </div>

                <div class="medicine-description mt-4">
                    <h5><i class="fas fa-info-circle"></i> Description</h5>
                    <p>${medicine.description || 'No description available.'}</p>
                </div>

                <div class="medicine-dosage mt-3">
                    <h5><i class="fas fa-prescription"></i> Recommended Dosage</h5>
                    <p>${medicine.dosage || 'Please consult your healthcare provider for dosage information.'}</p>
                </div>

                ${medicine.uses && medicine.uses.length > 0 ? `
                    <div class="medicine-uses mt-3">
                        <h5><i class="fas fa-check-circle"></i> Uses</h5>
                        <ul class="list-unstyled">
                            ${medicine.uses.map(use => `
                                <li><i class="fas fa-check text-success"></i> ${use}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${medicine.sideEffects && medicine.sideEffects.length > 0 ? `
                    <div class="medicine-side-effects mt-3">
                        <h5><i class="fas fa-exclamation-triangle"></i> Side Effects</h5>
                        <ul class="list-unstyled">
                            ${medicine.sideEffects.map(effect => `
                                <li><i class="fas fa-exclamation-circle text-warning"></i> ${effect}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="medicine-warning mt-4">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Important Notice:</strong> The information provided is for general guidance only. 
                        Always consult a healthcare professional before taking any medication.
                        ${medicine.prescription ? ' This medicine requires a valid prescription from a licensed healthcare provider.' : ''}
                    </div>
                </div>
            </div>
        `;
        
        const modalTitle = document.querySelector('#medicineModal .modal-title');
        modalTitle.innerHTML = `<i class="fas fa-pills"></i> Medicine Details`;
        
        const modal = new bootstrap.Modal(document.getElementById('medicineModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching medicine details:', error);
        alert('Failed to load medicine details. Please try again.');
    }
}

// Initialize map and event listeners when page loads
window.addEventListener('load', () => {
    initMap();
    initEventListeners();
});
