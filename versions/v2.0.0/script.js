let objects = [];
let map;
let markers = [];
let tempMarker = null;

// Инициализация карты
function initMap() {
    map = L.map("map").setView([41.3111, 69.2797], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", function (e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;

        if (tempMarker) {
            tempMarker.setLatLng([lat, lng]);
        } else {
            tempMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
            tempMarker.on("dragend", function (ev) {
                const pos = ev.target.getLatLng();
                document.getElementById("lat").value = pos.lat.toFixed(6);
                document.getElementById("lng").value = pos.lng.toFixed(6);
            });
        }
    });
}

// Рендер объектов на карте
function renderMarkers(filteredObjects) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    filteredObjects.forEach((obj, index) => {
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
            popupContent += `<a href="${obj.contact}" target="_blank">Связаться</a><br>`;
        }

        popupContent += `<button onclick="scrollToCard(${index})">Подробнее</button>`;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// Скролл к карточке
function scrollToCard(index) {
    const cards = document.querySelectorAll(".result-card");
    if (cards[index]) {
        cards[index].scrollIntoView({ behavior: "smooth", block: "center" });
        cards[index].style.background = "#eaffea";
        setTimeout(() => {
            cards[index].style.background = "white";
        }, 1500);
    }
}

// Фильтрация
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

// Отображение карточек
function renderResults(list) {
    const resultsDiv = document.getElementById("resultsList");
    resultsDiv.innerHTML = "";

    if (list.length === 0) {
        resultsDiv.innerHTML = "<p>Ничего не найдено</p>";
        return;
    }

    list.forEach((obj, idx) => {
        let card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
            <h3>${obj.title}</h3>
            <p>${obj.price} у.е. · ${obj.rooms} комн. · ${obj.area} м²</p>
            <p><i>${obj.category}, ${obj.status}</i></p>
        `;

        if (obj.photos && obj.photos.length > 0) {
            let slider = document.createElement("div");
            slider.className = "photo-slider";
            slider.dataset.index = "0"; // текущая картинка

            let img = document.createElement("img");
            img.src = obj.photos[0];
            img.className = "slider-img";
            slider.appendChild(img);

            // кнопки
            let prevBtn = document.createElement("button");
            prevBtn.innerText = "◀";
            prevBtn.className = "slider-btn prev";
            prevBtn.onclick = () => changeSlide(slider, obj.photos, -1);

            let nextBtn = document.createElement("button");
            nextBtn.innerText = "▶";
            nextBtn.className = "slider-btn next";
            nextBtn.onclick = () => changeSlide(slider, obj.photos, 1);

            slider.appendChild(prevBtn);
            slider.appendChild(nextBtn);

            card.appendChild(slider);
        }

        if (obj.contact) {
            card.innerHTML += `<p><a href="${obj.contact}" target="_blank">Связаться</a></p>`;
        }

        resultsDiv.appendChild(card);
    });
}

// Логика переключения слайдов
function changeSlide(slider, photos, direction) {
    let index = parseInt(slider.dataset.index);
    index = (index + direction + photos.length) % photos.length;
    slider.dataset.index = index;
    slider.querySelector(".slider-img").src = photos[index];
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

    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }

    document.getElementById("addForm").reset();
}

// Запуск
window.onload = () => {
    initMap();
    renderResults(objects);
    map.whenReady(() => {
        map.invalidateSize();
    });
};
