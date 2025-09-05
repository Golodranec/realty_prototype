alert("✅ script.js v6 загружен");

let objects = [];
let map;
let markers = [];
let tempMarker = null;

function saveObjects() {
  localStorage.setItem("objects", JSON.stringify(objects));
}

function loadObjects() {
  const data = localStorage.getItem("objects");
  objects = data ? JSON.parse(data) : [];
}

function initMap() {
  map = L.map("map").setView([41.3111, 69.2797], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  map.on("click", e => {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;

    if (tempMarker) {
      tempMarker.setLatLng([lat, lng]);
    } else {
      tempMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
      tempMarker.on("dragend", ev => {
        const pos = ev.target.getLatLng();
        document.getElementById("lat").value = pos.lat.toFixed(6);
        document.getElementById("lng").value = pos.lng.toFixed(6);
      });
    }
  });
}

function renderMarkers(list) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  list.forEach((obj, index) => {
    if (!obj.lat || !obj.lng) return;

    const marker = L.marker([obj.lat, obj.lng]).addTo(map);

    let popupContent = `<b>${obj.title}</b><br>
      ${obj.price} у.е. · ${obj.rooms} комн. · ${obj.area} м²<br>
      <i>${obj.category}, ${obj.status}</i><br>`;

    if (obj.photos && obj.photos.length > 0) {
      obj.photos.forEach(src => {
        popupContent += `<img src="${src}" class="popup-photo"><br>`;
      });
    }

    if (obj.contact) {
      popupContent += `<a href="${obj.contact}" target="_blank">Связаться</a><br>`;
    }

    popupContent += `<button onclick="scrollToCard(${index})">Интересует</button>`;
    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

function scrollToCard(index) {
  const cards = document.querySelectorAll(".result-card");
  if (cards[index]) {
    cards[index].scrollIntoView({ behavior: "smooth", block: "center" });
    cards[index].style.background = "#eaffea";
    setTimeout(() => (cards[index].style.background = "white"), 1500);
  }
}

function applyFilter() {
  const category = document.getElementById("filterCategory").value;
  const status = document.getElementById("filterStatus").value;
  const priceFrom = parseFloat(document.getElementById("filterPriceMin").value) || 0;
  const priceTo = parseFloat(document.getElementById("filterPriceMax").value) || Infinity;
  const roomsFrom = parseInt(document.getElementById("filterRoomsMin").value) || 0;
  const roomsTo = parseInt(document.getElementById("filterRoomsMax").value) || Infinity;

  const filtered = objects.filter(obj =>
    (category === "Любая" || obj.category === category) &&
    (status === "Любой" || obj.status === status) &&
    obj.price >= priceFrom && obj.price <= priceTo &&
    obj.rooms >= roomsFrom && obj.rooms <= roomsTo
  );

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
      <p><i>${obj.category}, ${obj.status}</i></p>`;

    if (obj.photos && obj.photos.length > 0) {
      obj.photos.forEach(src => {
        let img = document.createElement("img");
        img.src = src;
        img.className = "popup-photo";
        card.appendChild(img);
      });
    }

    if (obj.contact) {
      card.innerHTML += `<p><a href="${obj.contact}" target="_blank">Связаться</a></p>`;
    }

    resultsDiv.appendChild(card);
  });
}

function addObject() {
  const title = document.getElementById("title").value;
  const price = parseFloat(document.getElementById("price").value) || 0;
  const rooms = parseInt(document.getElementById("rooms").value) || 0;
  const area = parseFloat(document.getElementById("area").value) || 0;
  const category = document.getElementById("category").value;
  const status = document.getElementById("status").value;
  let contact = document.getElementById("contact").value;
  const lat = parseFloat(document.getElementById("lat").value) || null;
  const lng = parseFloat(document.getElementById("lng").value) || null;

  if (contact.startsWith("@")) contact = "https://t.me/" + contact.slice(1);
  else if (contact.startsWith("t.me/")) contact = "https://" + contact;

  const files = document.getElementById("photo").files;
  console.log("📂 Выбрано файлов:", files.length);

  if (files.length === 0) {
    saveNewObject({ title, price, rooms, area, category, status, contact, lat, lng, photos: [] });
    return;
  }

  let readers = [];
  for (let i = 0; i < files.length; i++) {
    readers.push(new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(files[i]);
    }));
  }

  Promise.all(readers).then(photosBase64 => {
    console.log("📸 Загружено фото:", photosBase64.length);
    saveNewObject({ title, price, rooms, area, category, status, contact, lat, lng, photos: photosBase64 });
  });
}

function saveNewObject(obj) {
  console.log("✅ Новый объект:", obj);
  objects.push(obj);
  saveObjects();

  renderResults(objects);
  renderMarkers(objects);

  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }

  document.getElementById("addForm").reset();
  document.getElementById("preview").innerHTML = "";

  alert("📌 Объект добавлен!");
}

function previewPhotos(event) {
  const previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = "";

  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = e => {
      let img = document.createElement("img");
      img.src = e.target.result;
      img.width = 80;
      img.height = 60;
      img.style.objectFit = "cover";
      img.style.margin = "5px";
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(files[i]);
  }
}

window.onload = () => {
  loadObjects();
  initMap();
  renderResults(objects);
  renderMarkers(objects);

  map.whenReady(() => map.invalidateSize());
};
