// Массив для хранения объектов
let objects = [];
let map;
let markers = [];

// Инициализация карты
function initMap() {
    map = L.map("map").setView([41.3111, 69.2797], 12); // центр Ташкента
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Клик по карте для выбора координат при добавлении объекта
    map.on("click", function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;
    });
}

// Рендер объектов на карте
function renderMarkers(filteredObjects) {
    // Очистка старых маркеров
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    filteredObjects.forEach(obj => {
        if (!obj.lat || !obj.lng) return;

        const marker = L.marker([obj.lat, obj.lng]).addTo(map);

        // Всплывающая карточка
        let popupContent = `
            <b>${obj.title}</b><br>
            ${obj.price} у.е. · ${obj.rooms} комн. · ${obj.area} м²<br>
            <i>${obj.category}, ${obj.status}</i><br>
        `;

        if (obj.photo) {
            popupContent += `<img src="${obj.photo}" width="150"><br>`;
        }

        if (obj.contact) {
            popupContent += `<a href="${obj.contact}" target="_blank">Связаться</a>`;
        }

        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// Применение фильтра
function applyFilter() {
    const category = document.getElementById("filterCategory").value;
    const status = document.getElementById("filterStatus").value;
    const priceFrom = parseFloat(document.getElementById("priceFrom").value) || 0;
    const priceTo = parseFloat(document.getElementById("priceTo").value) || Infinity;
    const roomsFrom = parseInt(document.getElementById("roomsFrom").value) || 0;
    const roomsTo = parseInt(document.getElementById("roomsTo").value) || Infinity;

    const filtered = objects.filter(obj => {
        return (
            (category === "Любая" || obj.category === category) &&
            (status === "Любой" || obj.status === status) &&
            obj.price >= priceFrom &&
            obj.price <= priceTo &&
            obj.rooms >= roomsFrom &&
            obj.rooms <= roomsTo
        );
    });

    renderResults(filtered);
    renderMarkers(filtered);
}

// Очистка фильтра
function resetFilter() {
    document.getElementById("filterCategory").value = "Любая";
    document.getElementById("filterStatus").value = "Любой";
    document.getElementById("priceFrom").value = "";
    document.getElementById("priceTo").value = "";
    document.getElementById("roomsFrom").value = "";
    document.getElementById("roomsTo").value = "";

    renderResults(objects);
    renderMarkers(objects);
}

// Отображение списка объявлений
function renderResults(list) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (list.length === 0) {
        resultsDiv.innerHTML = "<p>Ничего не найдено</p>";
        return;
    }

    list.forEach(obj => {
        let card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
            <h3>${obj.title}</h3>
            <p>${obj.price} у.е. · ${obj.rooms} комн. · ${obj.area} м²</p>
            <p><i>${obj.category}, ${obj.status}</i></p>
        `;

        if (obj.photo) {
            card.innerHTML += `<img src="${obj.photo}" width="200">`;
        }

        if (obj.contact) {
            card.innerHTML += `<p><a href="${obj.contact}" target="_blank">Связаться в Telegram</a></p>`;
        }

        resultsDiv.appendChild(card);
    });
}

// Добавление нового объекта
function addObject() {
    const title = document.getElementById("title").value;
    const price = parseFloat(document.getElementById("price").value) || 0;
    const rooms = parseInt(document.getElementById("rooms").value) || 0;
    const area = parseFloat(document.getElementById("area").value) || 0;
    const category = document.getElementById("category").value;
    const status = document.getElementById("status").value;
    const contact = document.getElementById("contact").value;
    const lat = parseFloat(document.getElementById("lat").value);
    const lng = parseFloat(document.getElementById("lng").value);

    let photo = "";
    const fileInput = document.getElementById("photo");
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        photo = URL.createObjectURL(file);
    }

    const newObj = { title, price, rooms, area, category, status, contact, lat, lng, photo };
    objects.push(newObj);

    renderResults(objects);
    renderMarkers(objects);

    document.getElementById("addForm").reset();
}

// Запуск
window.onload = () => {
    initMap();
    renderResults(objects);
};
