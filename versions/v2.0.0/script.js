alert("✅ script.js v9.2 загружен");

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
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  map.on("click", e => {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;

    if (tempMarker) {
      tempMarker.setLatLng([lat, lng]);
    } else {
      tempMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
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
      popupContent += `
        <div class="photo-slider" data-index="0" id="popup-slider-${index}">
          <img src="${obj.photos[0]}" class="popup-photo slider-img" onclick="scrollToCard(${index})">
          <button class="slider-btn prev" onclick="changePopupSlide(${index}, -1)">◀</button>
          <button class="slider-btn next" onclick="changePopupSlide(${index}, 1)">▶</button>
          <div class="slider-counter" id="popup-counter-${index}">1 / ${obj.photos.length}</div>
        </div>
      `;
    }

    if (obj.contact) {
      popupContent += `<a href="${obj.contact}" target="_blank">Связаться</a><br>`;
    }

    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

function changePopupSlide(idx, direction) {
  const slider = document.getElementById(`popup-slider-${idx}`);
  if (!slider) return;
  let index = parseInt(slider.dataset.index);
  const photos = objects[idx].photos;
  index = (index + direction + photos.length) % photos.length;
  slider.dataset.index = index;
  slider.querySelector(".slider-img").src = photos[index];
  document.getElementById(`popup-counter-${idx}`).innerText = `${index + 1} / ${photos.length}`;
}

function renderResults(list) {
  const resultsDiv = document.getElementById("resultsList");
  resultsDiv.innerHTML = "";

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
      slider.dataset.index = "0";

      let img = document.createElement("img");
      img.src = obj.photos[0];
      img.className = "slider-img";
      slider.appendChild(img);

      let prevBtn = document.createElement("button");
      prevBtn.innerText = "◀";
      prevBtn.className = "slider-btn prev";
      prevBtn.onclick = () => changeSlide(slider, obj.photos, -1, counter);

      let nextBtn = document.createElement("button");
      nextBtn.innerText = "▶";
      nextBtn.className = "slider-btn next";
      nextBtn.onclick = () => changeSlide(slider, obj.photos, 1, counter);

      let counter = document.createElement("div");
      counter.className = "slider-counter";
      counter.innerText = `1 / ${obj.photos.length}`;

      slider.appendChild(prevBtn);
      slider.appendChild(nextBtn);
      slider.appendChild(counter);

      card.appendChild(slider);
    }

    if (obj.contact) {
      card.innerHTML += `<p><a href="${obj.contact}" target="_blank">Связаться</a></p>`;
    }

    // кнопка удаления
    let delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.innerText = "Удалить";
    delBtn.onclick = () => deleteObject(idx);
    card.appendChild(delBtn);

    resultsDiv.appendChild(card);
  });
}

function changeSlide(slider, photos, direction, counterEl) {
  let index = parseInt(slider.dataset.index);
  index = (index + direction + photos.length) % photos.length;
  slider.dataset.index = index;
  slider.querySelector(".slider-img").src = photos[index];
  counterEl.innerText = `${index + 1} / ${photos.length}`;
}

function scrollToCard(index) {
  const cards = document.querySelectorAll(".result-card");
  if (cards[index]) {
    cards[index].scrollIntoView({ behavior: "smooth", block: "center" });
    cards[index].style.boxShadow = "0 0 10px 3px #4CAF50";
    setTimeout(() => {
      cards[index].style.boxShadow = "none";
    }, 2000);
  }
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
  let readers = [];
  for (let i = 0; i < files.length; i++) {
    readers.push(new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(files[i]);
    }));
  }

  Promise.all(readers).then(photosBase64 => {
    objects.push({ title, price, rooms, area, category, status, contact, lat, lng, photos: photosBase64 });
    saveObjects();
    renderResults(objects);
    renderMarkers(objects);
    document.getElementById("addForm").reset();
    document.getElementById("preview").innerHTML = "";
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    alert("📌 Объект добавлен!");
  });
}

function deleteObject(index) {
  if (!confirm("Удалить этот объект?")) return;
  objects.splice(index, 1);
  saveObjects();
  renderResults(objects);
  renderMarkers(objects);
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
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(files[i]);
  }
}

/* ====== Фильтр ====== */
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

window.onload = () => {
  loadObjects();
  initMap();
  renderResults(objects);
  renderMarkers(objects);
};
