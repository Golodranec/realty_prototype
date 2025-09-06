alert("✅ script.js v10 загружен");

let objects = [];
let map;
let markers = [];
let tempMarker = null;
let editingIndex = null; // индекс редактируемого объекта (в objects) или null

/* ===== Storage ===== */
function saveObjects() {
  localStorage.setItem("objects", JSON.stringify(objects));
}
function loadObjects() {
  const data = localStorage.getItem("objects");
  objects = data ? JSON.parse(data) : [];
}

/* ===== Map ===== */
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
      tempMarker.on("dragend", ev => {
        const p = ev.target.getLatLng();
        document.getElementById("lat").value = p.lat.toFixed(6);
        document.getElementById("lng").value = p.lng.toFixed(6);
      });
    }
  });
}

function renderMarkers(list) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  list.forEach((obj) => {
    if (obj.lat == null || obj.lng == null) return;

    const realIdx = objects.indexOf(obj); // корректный индекс в общем массиве
    const marker = L.marker([obj.lat, obj.lng]).addTo(map);

    let popupContent = `<b>${obj.title}</b><br>
      ${obj.price || 0} у.е. · ${obj.rooms || 0} комн. · ${obj.area || 0} м²<br>
      <i>${obj.category || ""}, ${obj.status || ""}</i><br>`;

    if (obj.photos && obj.photos.length > 0) {
      popupContent += `
        <div class="photo-slider" data-index="0" id="popup-slider-${realIdx}">
          <img src="${obj.photos[0]}" class="popup-photo slider-img" onclick="scrollToCard(${realIdx})">
          <button class="slider-btn prev" onclick="changePopupSlide(${realIdx}, -1)">◀</button>
          <button class="slider-btn next" onclick="changePopupSlide(${realIdx}, 1)">▶</button>
          <div class="slider-counter" id="popup-counter-${realIdx}">1 / ${obj.photos.length}</div>
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

function changePopupSlide(realIdx, direction) {
  const slider = document.getElementById(`popup-slider-${realIdx}`);
  if (!slider) return;
  let index = parseInt(slider.dataset.index);
  const photos = objects[realIdx].photos || [];
  if (photos.length === 0) return;
  index = (index + direction + photos.length) % photos.length;
  slider.dataset.index = index;
  slider.querySelector(".slider-img").src = photos[index];
  const cnt = document.getElementById(`popup-counter-${realIdx}`);
  if (cnt) cnt.innerText = `${index + 1} / ${photos.length}`;
}

/* ===== Results list ===== */
function renderResults(list) {
  const resultsDiv = document.getElementById("resultsList");
  resultsDiv.innerHTML = "";

  if (list.length === 0) {
    resultsDiv.innerHTML = "<p>Ничего не найдено</p>";
    return;
  }

  list.forEach((obj) => {
    const realIdx = objects.indexOf(obj);
    const card = document.createElement("div");
    card.className = "result-card";
    card.dataset.idx = String(realIdx);

    card.innerHTML = `
      <h3>${obj.title}</h3>
      <p>${obj.price || 0} у.е. · ${obj.rooms || 0} комн. · ${obj.area || 0} м²</p>
      <p><i>${obj.category || ""}, ${obj.status || ""}</i></p>
    `;

    if (obj.photos && obj.photos.length > 0) {
      const slider = document.createElement("div");
      slider.className = "photo-slider";
      slider.dataset.index = "0";

      const img = document.createElement("img");
      img.src = obj.photos[0];
      img.className = "slider-img";
      slider.appendChild(img);

      const counter = document.createElement("div");
      counter.className = "slider-counter";
      counter.innerText = `1 / ${obj.photos.length}`;

      const prevBtn = document.createElement("button");
      prevBtn.className = "slider-btn prev";
      prevBtn.innerText = "◀";
      prevBtn.onclick = () => changeSlide(slider, obj.photos, -1, counter);

      const nextBtn = document.createElement("button");
      nextBtn.className = "slider-btn next";
      nextBtn.innerText = "▶";
      nextBtn.onclick = () => changeSlide(slider, obj.photos, 1, counter);

      slider.appendChild(prevBtn);
      slider.appendChild(nextBtn);
      slider.appendChild(counter);
      card.appendChild(slider);
    }

    if (obj.contact) {
      const contactP = document.createElement("p");
      contactP.innerHTML = `<a href="${obj.contact}" target="_blank">Связаться</a>`;
      card.appendChild(contactP);
    }

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerText = "Редактировать";
    editBtn.onclick = () => startEdit(realIdx);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.innerText = "Удалить";
    delBtn.onclick = () => deleteObject(realIdx);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);

    resultsDiv.appendChild(card);
  });
}

function changeSlide(slider, photos, direction, counterEl) {
  if (!photos || photos.length === 0) return;
  let index = parseInt(slider.dataset.index);
  index = (index + direction + photos.length) % photos.length;
  slider.dataset.index = index;
  slider.querySelector(".slider-img").src = photos[index];
  if (counterEl) counterEl.innerText = `${index + 1} / ${photos.length}`;
}

/* ===== Scroll helper ===== */
function scrollToCard(realIdx) {
  const card = document.querySelector(`.result-card[data-idx="${realIdx}"]`);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.style.boxShadow = "0 0 10px 3px #4CAF50";
    setTimeout(() => (card.style.boxShadow = "none"), 1500);
  }
}

/* ===== Add / Edit flow ===== */
function submitForm() {
  if (editingIndex === null) {
    addObject();
  } else {
    applyEdit();
  }
}

function normalizeContact(value) {
  let contact = value || "";
  if (contact.startsWith("@")) contact = "https://t.me/" + contact.slice(1);
  else if (contact.startsWith("t.me/")) contact = "https://" + contact;
  return contact;
}

function readFilesAsBase64(fileList) {
  const files = fileList;
  const readers = [];
  for (let i = 0; i < files.length; i++) {
    readers.push(new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(files[i]);
    }));
  }
  return Promise.all(readers);
}

function addObject() {
  const title = document.getElementById("title").value.trim();
  const price = parseFloat(document.getElementById("price").value) || 0;
  const rooms = parseInt(document.getElementById("rooms").value) || 0;
  const area = parseFloat(document.getElementById("area").value) || 0;
  const category = document.getElementById("category").value;
  const status = document.getElementById("status").value;
  const contact = normalizeContact(document.getElementById("contact").value);
  const lat = parseFloat(document.getElementById("lat").value) || null;
  const lng = parseFloat(document.getElementById("lng").value) || null;

  const fileInput = document.getElementById("photo");
  if (fileInput.files.length === 0) {
    objects.push({ title, price, rooms, area, category, status, contact, lat, lng, photos: [] });
    saveObjects();
    rerenderAll();
    clearForm();
    alert("📌 Объект добавлен!");
    return;
  }

  readFilesAsBase64(fileInput.files).then(photosBase64 => {
    objects.push({ title, price, rooms, area, category, status, contact, lat, lng, photos: photosBase64 });
    saveObjects();
    rerenderAll();
    clearForm();
    alert("📌 Объект добавлен!");
  });
}

function startEdit(realIdx) {
  const obj = objects[realIdx];
  editingIndex = realIdx;

  document.getElementById("formTitle").innerText = "Редактировать объект";
  document.getElementById("submitBtn").innerText = "Сохранить изменения";
  document.getElementById("cancelEditBtn").classList.remove("hidden");
  document.getElementById("editBadge").classList.remove("hidden");

  document.getElementById("title").value = obj.title || "";
  document.getElementById("price").value = obj.price || "";
  document.getElementById("rooms").value = obj.rooms || "";
  document.getElementById("area").value = obj.area || "";
  document.getElementById("category").value = obj.category || "Квартира";
  document.getElementById("status").value = obj.status || "Аренда";
  document.getElementById("contact").value = obj.contact || "";
  document.getElementById("lat").value = obj.lat ?? "";
  document.getElementById("lng").value = obj.lng ?? "";

  // превью текущих фото (как подсказка)
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  if (obj.photos && obj.photos.length) {
    obj.photos.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      preview.appendChild(img);
    });
  }

  // подсветим карточку
  scrollToCard(realIdx);
}

function applyEdit() {
  const idx = editingIndex;
  if (idx === null) return;

  const title = document.getElementById("title").value.trim();
  const price = parseFloat(document.getElementById("price").value) || 0;
  const rooms = parseInt(document.getElementById("rooms").value) || 0;
  const area = parseFloat(document.getElementById("area").value) || 0;
  const category = document.getElementById("category").value;
  const status = document.getElementById("status").value;
  const contact = normalizeContact(document.getElementById("contact").value);
  const lat = parseFloat(document.getElementById("lat").value) || null;
  const lng = parseFloat(document.getElementById("lng").value) || null;

  const fileInput = document.getElementById("photo");
  const updateCore = (photosToUse) => {
    objects[idx] = {
      ...objects[idx],
      title, price, rooms, area, category, status, contact, lat, lng,
      photos: photosToUse
    };
    saveObjects();
    rerenderAll();
    clearForm();
    alert("✏️ Изменения сохранены!");
  };

  if (fileInput.files.length === 0) {
    // фото не трогаем
    updateCore(objects[idx].photos || []);
  } else {
    // заменяем фото на новые
    readFilesAsBase64(fileInput.files).then(photosBase64 => updateCore(photosBase64));
  }
}

function cancelEdit() {
  clearForm();
}

function deleteObject(realIdx) {
  if (!confirm("Удалить этот объект?")) return;
  objects.splice(realIdx, 1);
  saveObjects();
  rerenderAll();
}

/* ===== Helpers ===== */
function previewPhotos(event) {
  const previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = "";
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(files[i]);
  }
}

function clearForm() {
  document.getElementById("addForm").reset();
  document.getElementById("preview").innerHTML = "";
  document.getElementById("lat").value = "";
  document.getElementById("lng").value = "";

  document.getElementById("formTitle").innerText = "Добавить объект";
  document.getElementById("submitBtn").innerText = "Добавить объект";
  document.getElementById("cancelEditBtn").classList.add("hidden");
  document.getElementById("editBadge").classList.add("hidden");
  editingIndex = null;

  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
}

function rerenderAll() {
  // если фильтр применён — пересчитаем по текущим значениям
  applyFilter();
}

/* ===== Filter ===== */
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
    (obj.price || 0) >= priceFrom && (obj.price || 0) <= priceTo &&
    (obj.rooms || 0) >= roomsFrom && (obj.rooms || 0) <= roomsTo
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

/* ===== Init ===== */
window.onload = () => {
  loadObjects();
  initMap();
  renderResults(objects);
  renderMarkers(objects);
};
