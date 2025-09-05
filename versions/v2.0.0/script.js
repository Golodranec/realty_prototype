let objects = [];
let map;
let markers = [];

// Инициализация карты
function initMap() {
    map = L.map("map").setView([41.3111, 69.2797], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Клик по карте для выбора координат
    map.on("click", function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;
    });
}

// Рендер объектов на карте
function renderMarkers(filteredObjects) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    filteredObjects.forEach(obj => {
        if (!obj.lat || !obj.lng) return;

        const marker = L.marker([obj.lat, obj.lng]).addTo(map);

        let popupContent = `
            <b>${obj.title}</b><br>
            ${obj.price} у.е. · ${obj.rooms} комн. · ${obj.area} м²<br>
            <i>${obj.category}, ${obj.status}</i><br>
        `;

        if (obj.photos && obj.photos.length > 0) {
            popupContent += `<img src="${obj.photos[0]}" width="150"><br>`;
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
    const priceFrom = parseFloat(document.getElementById("filterPriceMin").value) || 0;
    const priceTo = parseFloat(document.getElementById("filterPriceMax").value) || Infinity;
    const roomsFrom = parseInt(document.getElementById("filterRoomsMin").value) || 0;
    const roomsTo = parseInt(document.getElementById("filterRoomsMax").value) || Infinity;

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

// Сброс фильтра
function resetFilter() {
    document.getElementById("filterCategory").value = "Любая";
    document.getElementById("filterStatus").value = "Любой";
    document.getElementById("filterPriceMin").value = "";
    document.getElementById("filterPriceMax").value = "";
    document.getElementById("filterRoomsMin").value = "";
    document.getElementById("filterRoomsMax").value = "";

    renderResults(objects);
    renderMarkers(objects);
}

// Отображение списка объявлений
function renderResults(list) {
    const resultsDiv = document.getElementById("resultsList");
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

        if (obj.photos && obj.photos.length > 0) {
            let gallery = document.createElement("div");
            gallery.className = "photo-gallery";

            obj.photos.forEach(src => {
                let img = document.createElement("img");
                img.src = src;
                img.width = 120;
                img.height = 90;
                img.style.objectFit = "cover";
                img.style.margin = "5px";
                gallery.appendChild(img);
            });
            card.appendChild(gallery);
        }

        if (obj.contact) {
            card.innerHTML += `<p><a href="${obj.contact}" target="_blank">Связаться</a></p>`;
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
    const lat = parseFloat(document.getElementById("lat").value) || null;
    const lng = parseFloat(document.getElementById("lng").value) || null;

    let photos = [];
    const fileInput = document.getElementById("photo");
    if (fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            photos.push(URL.createObjectURL(fileInput.files[i]));
        }
    }

    const newObj = { title, price, rooms, area, category, status, contact, lat, lng, photos };
    objects.push(newObj);

    renderResults(objects);
    renderMarkers(objects);

    document.getElementById("addForm").reset();
}

// Запуск
window.onload = () => {
    initMap();
    renderResults(objects);

    // фикс для карты (чтобы тайлы не разъезжались)
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
};
