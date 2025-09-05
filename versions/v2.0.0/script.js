// Хранилище объектов
let objects = [];
let map;
let currentMarkers = [];

// Инициализация карты
function initMap() {
  map = L.map('map').setView([41.3111, 69.2797], 12); // Центр Ташкента

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  renderMarkers(objects);
}

// Рендер маркеров на карте
function renderMarkers(data) {
  // очистить старые маркеры
  currentMarkers.forEach(m => map.removeLayer(m));
  currentMarkers = [];

  data.forEach(obj => {
    const marker = L.marker([obj.lat, obj.lng]).addTo(map);
    let popupHtml = `<b>${obj.title}</b><br>${obj.price} $<br>${obj.rooms} комн.<br>`;
    if (obj.photos && obj.photos.length > 0) {
      popupHtml += `<img src="${obj.photos[0]}" width="150" style="margin-top:5px;border-radius:4px;">`;
    }
    marker.bindPopup(popupHtml);
    currentMarkers.push(marker);
  });
}

// Отображение результатов списком
function renderResults(data) {
  const results = document.getElementById('results');
  results.innerHTML = '';

  if (data.length === 0) {
    results.innerHTML = '<p>Нет объектов по заданным параметрам.</p>';
    return;
  }

  const ul = document.createElement('ul');
  data.forEach(obj => {
    const li = document.createElement('li');
    li.innerHTML = `<b>${obj.title}</b> — ${obj.price} $ — ${obj.rooms} комн. — ${obj.area} м²<br>`;
    if (obj.photos && obj.photos.length > 0) {
      obj.photos.forEach(photo => {
        const img = document.createElement('img');
        img.src = photo;
        img.width = 100;
        li.appendChild(img);
      });
    }
    ul.appendChild(li);
  });
  results.appendChild(ul);
}

// Добавление объекта
document.getElementById('addObject').addEventListener('submit', function(e) {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const price = parseFloat(document.getElementById('price').value);
  const rooms = parseInt(document.getElementById('rooms').value);
  const area = parseFloat(document.getElementById('area').value);
  const category = document.getElementById('category').value;
  const status = document.getElementById('status').value;
  const lat = selectedLat || 41.3111;
  const lng = selectedLng || 69.2797;

  const photosInput = document.getElementById('photos');
  const photos = [];
  if (photosInput.files) {
    for (let file of photosInput.files) {
      const url = URL.createObjectURL(file);
      photos.push(url);
    }
  }

  const newObj = { title, price, rooms, area, category, status, lat, lng, photos };
  objects.push(newObj);

  renderResults(objects);
  renderMarkers(objects);

  this.reset();
});

// Переменные для выбранной точки
let selectedLat = null;
let selectedLng = null;

// Клик по карте для выбора координат
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  map.on('click', function(e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;
    alert(`Выбрано место: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`);
  });
});

// Фильтрация
function filterObjects() {
  const category = document.getElementById('filterCategory').value;
  const status = document.getElementById('filterStatus').value;
  const priceMin = parseFloat(document.getElementById('filterPriceMin').value) || 0;
  const priceMax = parseFloat(document.getElementById('filterPriceMax').value) || Infinity;
  const roomsMin = parseInt(document.getElementById('filterRoomsMin').value) || 0;
  const roomsMax = parseInt(document.getElementById('filterRoomsMax').value) || Infinity;

  const filtered = objects.filter(obj => {
    return (category === "Любая" || obj.category === category) &&
           (status === "Любой" || obj.status === status) &&
           obj.price >= priceMin && obj.price <= priceMax &&
           obj.rooms >= roomsMin && obj.rooms <= roomsMax;
  });

  renderResults(filtered);
  renderMarkers(filtered);
}

document.getElementById('applyFilter').addEventListener('click', filterObjects);
document.getElementById('resetFilter').addEventListener('click', () => {
  document.getElementById('filterCategory').value = "Любая";
  document.getElementById('filterStatus').value = "Любой";
  document.getElementById('filterPriceMin').value = "";
  document.getElementById('filterPriceMax').value = "";
  document.getElementById('filterRoomsMin').value = "";
  document.getElementById('filterRoomsMax').value = "";
  renderResults(objects);
  renderMarkers(objects);
});
