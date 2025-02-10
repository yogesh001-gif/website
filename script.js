// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards for scroll animations
document.querySelectorAll('.illness-card, .medicine-card, .emergency-card').forEach(card => {
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease-out';
    observer.observe(card);
});

// Add hover effect to cards
const cards = document.querySelectorAll('.illness-card, .medicine-card');
cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Add warning popup for emergency section
document.querySelector('.emergency-section').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        alert('If you are experiencing this symptom, please seek immediate medical attention!');
    }
});

// Medicine database
const medicineDatabase = [
    {
        name: "Crocin",
        genericName: "Paracetamol",
        brandNames: ["Crocin", "Dolo", "Calpol"],
        uses: ["बुखार", "सिरदर्द", "शरीर में दर्द", "Fever", "Headache", "Body pain"],
        dosage: "650mg की गोली दिन में 3-4 बार (650mg tablet 3-4 times a day)",
        sideEffects: ["लिवर पर असर (rare liver problems)", "मितली (nausea)"],
        warnings: "एक दिन में 4 गोली से ज्यादा न लें। Do not exceed 4 tablets per day."
    },
    {
        name: "Zandu Balm",
        genericName: "Menthol and Methyl Salicylate",
        brandNames: ["Zandu Balm", "Tiger Balm", "Amrutanjan"],
        uses: ["सिरदर्द", "मांसपेशियों में दर्द", "Headache", "Muscle pain"],
        dosage: "प्रभावित जगह पर लगाएं (Apply locally on affected area)",
        sideEffects: ["त्वचा में जलन (Skin irritation)"],
        warnings: "आंखों से दूर रखें। Keep away from eyes."
    },
    {
        name: "Vicks Action 500",
        genericName: "Paracetamol + Phenylephrine + Caffeine",
        brandNames: ["Vicks Action 500", "Coldarin", "Cofsils"],
        uses: ["सर्दी", "जुकाम", "बुखार", "Cold", "Flu", "Fever"],
        dosage: "दिन में 3 बार 1 गोली (1 tablet thrice a day)",
        sideEffects: ["नींद में कमी (sleeplessness)", "मुंह सूखना (dry mouth)"],
        warnings: "हाई ब्लड प्रेशर के मरीज सावधानी बरतें। Caution in high blood pressure."
    },
    {
        name: "Pudin Hara",
        genericName: "Mint Oil",
        brandNames: ["Pudin Hara", "Dabur Pudin Hara"],
        uses: ["पेट दर्द", "गैस", "Stomach ache", "Gas", "Indigestion"],
        dosage: "2-3 बूंद पानी के साथ (2-3 drops with water)",
        sideEffects: ["कोई विशेष नहीं (None significant)"],
        warnings: "खाली पेट न लें। Do not take on empty stomach."
    },
    {
        name: "Gelusil",
        genericName: "Magaldrate + Simethicone",
        brandNames: ["Gelusil", "Digene", "ENO"],
        uses: ["एसिडिटी", "पेट में जलन", "Acidity", "Heartburn"],
        dosage: "1-2 टैबलेट चबा कर खाएं (Chew 1-2 tablets)",
        sideEffects: ["कब्ज (constipation)", "दस्त (diarrhea)"],
        warnings: "लगातार उपयोग न करें। Not for continuous use."
    },
    {
        name: "Liv.52",
        genericName: "Herbal Compound",
        brandNames: ["Liv.52", "Himalaya Liv.52"],
        uses: ["लिवर की सुरक्षा", "पाचन में सुधार", "Liver protection", "Digestion improvement"],
        dosage: "1-2 टैबलेट दिन में दो बार (1-2 tablets twice daily)",
        sideEffects: ["सामान्यतः सुरक्षित (Generally safe)"],
        warnings: "गर्भावस्था में डॉक्टर की सलाह लें। Consult doctor during pregnancy."
    }
];

// Store Locator
let map;
let markers = [];
let infoWindow;
let currentPosition;

// Mock database of store inventories (in a real app, this would come from a backend)
const storeInventories = {
    'store1': ['Crocin', 'Dolo', 'Vicks Action 500', 'Pudin Hara', 'Gelusil'],
    'store2': ['Zandu Balm', 'Liv.52', 'Crocin', 'ENO', 'Pudin Hara'],
    'store3': ['Dolo', 'Vicks Action 500', 'Gelusil', 'Zandu Balm', 'ENO'],
};

function initMap() {
    // Initialize map centered on India
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5
    });
    
    infoWindow = new google.maps.InfoWindow();
    
    // Add event listeners
    document.getElementById('use-location-btn').addEventListener('click', getUserLocation);
    document.getElementById('search-stores-btn').addEventListener('click', searchNearbyStores);
    document.getElementById('check-availability-btn').addEventListener('click', checkMedicineAvailability);
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(currentPosition);
                map.setZoom(14);
                
                // Place marker at user location
                new google.maps.Marker({
                    position: currentPosition,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#ffffff',
                    },
                    title: 'Your Location'
                });
                
                // Auto-search nearby stores
                searchNearbyStores();
            },
            (error) => {
                alert('Error getting your location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

function searchNearbyStores() {
    const location = currentPosition || map.getCenter();
    const request = {
        location: location,
        radius: '5000',
        type: ['pharmacy'],
        keyword: 'medical store pharmacy chemist'
    };
    
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearMarkers();
            const storeList = document.getElementById('store-list');
            storeList.innerHTML = '';
            
            // Filter results based on checkboxes
            let filteredResults = results;
            if (document.getElementById('open-now').checked) {
                filteredResults = filteredResults.filter(place => place.opening_hours?.isOpen());
            }
            if (document.getElementById('24-hours').checked) {
                filteredResults = filteredResults.filter(place => place.opening_hours?.periods?.length === 24);
            }
            
            // Update store select dropdown
            const storeSelect = document.getElementById('selected-store');
            storeSelect.innerHTML = '<option value="">Select a store</option>';
            
            filteredResults.forEach((place, i) => {
                createMarker(place);
                createStoreCard(place, i);
                
                // Add to store select
                const option = document.createElement('option');
                option.value = `store${i + 1}`;
                option.textContent = place.name;
                storeSelect.appendChild(option);
            });
        }
    });
}

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name
    });
    
    markers.push(marker);
    
    google.maps.event.addListener(marker, 'click', () => {
        const content = `
            <div class="info-window">
                <h3>${place.name}</h3>
                <p>${place.vicinity}</p>
                ${place.opening_hours ? 
                    `<p class="status ${place.opening_hours.isOpen() ? 'available' : 'not-available'}">
                        ${place.opening_hours.isOpen() ? 'Open Now' : 'Closed'}
                    </p>` : ''}
                <p>Rating: ${place.rating ? `${place.rating}/5` : 'Not rated'}</p>
            </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
}

function createStoreCard(place, index) {
    const storeList = document.getElementById('store-list');
    const card = document.createElement('div');
    card.className = 'store-card';
    
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        currentPosition ? new google.maps.LatLng(currentPosition) : map.getCenter(),
        place.geometry.location
    );
    
    card.innerHTML = `
        <h3>${place.name}</h3>
        <p>${place.vicinity}</p>
        ${place.opening_hours ? 
            `<p class="status ${place.opening_hours.isOpen() ? 'available' : 'not-available'}">
                ${place.opening_hours.isOpen() ? 'Open Now' : 'Closed'}
            </p>` : ''}
        <p class="distance">${(distance / 1000).toFixed(1)} km away</p>
        <p>Rating: ${place.rating ? `${place.rating}/5` : 'Not rated'}</p>
    `;
    
    card.addEventListener('click', () => {
        map.setCenter(place.geometry.location);
        map.setZoom(16);
        google.maps.event.trigger(markers[index], 'click');
    });
    
    storeList.appendChild(card);
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function checkMedicineAvailability() {
    const medicineName = document.getElementById('medicine-name').value.trim();
    const selectedStore = document.getElementById('selected-store').value;
    const resultDiv = document.getElementById('availability-result');
    
    if (!medicineName || !selectedStore) {
        resultDiv.innerHTML = '<p class="not-available">Please select a store and enter a medicine name</p>';
        return;
    }
    
    // Check if medicine is in store's inventory (mock data)
    const inventory = storeInventories[selectedStore] || [];
    const isAvailable = inventory.some(med => 
        med.toLowerCase().includes(medicineName.toLowerCase())
    );
    
    resultDiv.innerHTML = isAvailable ?
        `<p class="available">✓ ${medicineName} is available at this store</p>` :
        `<p class="not-available">✗ ${medicineName} is currently not in stock</p>`;
}

// Search functionality
const searchInput = document.getElementById('medicine-search');
const searchButton = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');

function searchMedicines(query) {
    return medicineDatabase.filter(medicine => 
        medicine.name.toLowerCase().includes(query.toLowerCase()) ||
        medicine.genericName.toLowerCase().includes(query.toLowerCase()) ||
        medicine.uses.some(use => use.toLowerCase().includes(query.toLowerCase()))
    );
}

function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="no-results">
                <p>कोई दवा नहीं मिली। No medicines found matching your search.</p>
            </div>
        `;
        return;
    }
    
    results.forEach(medicine => {
        const resultCard = document.createElement('div');
        resultCard.className = 'search-result-card';
        resultCard.innerHTML = `
            <h3>${medicine.name}</h3>
            <p><small>(${medicine.genericName})</small></p>
            <div class="medicine-details">
                <p><span class="label">Brand Names (ब्रांड):</span> ${medicine.brandNames.join(', ')}</p>
                <p><span class="label">Uses (उपयोग):</span> ${medicine.uses.join(', ')}</p>
                <p><span class="label">Dosage (मात्रा):</span> ${medicine.dosage}</p>
                <p><span class="label">Side Effects (दुष्प्रभाव):</span> ${medicine.sideEffects.join(', ')}</p>
                <p><span class="label">Warnings (चेतावनी):</span> ${medicine.warnings}</p>
            </div>
        `;
        searchResults.appendChild(resultCard);
    });
}

// Event listeners for search
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        const results = searchMedicines(query);
        displaySearchResults(results);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            const results = searchMedicines(query);
            displaySearchResults(results);
        }
    }
});

// Clear results when search input is cleared
searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() === '') {
        searchResults.innerHTML = '';
    }
});

initMap();
