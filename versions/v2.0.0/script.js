// === ИНИЦИАЛИЗАЦИЯ КАРТЫ ===
const map = L.map('map').setView([41.3111, 69.2797], 12); // Центр Ташкента

// Подгрузка тайлов OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(map);

// Контейнер для маркеров
let markersLayer = L.layerGroup().addTo(map);

// Функция отрисовки объектов на карте
function renderMarkers(objects) {
  markersLayer.clearLayers(); // чистим старые маркеры

  objects.forEach(obj => {
    if (obj.lat && obj.lng) {
      const marker = L.marker([obj.lat, obj.lng]).addTo(markersLayer);
      marker.bindPopup(`
        <b>${obj.title}</b><br>
        ${obj.price ? obj.price + " $": ""}
        ${obj.rooms ? "<br>Комнат: " + obj.rooms : ""}
        ${obj.area ? "<br>Площадь: " + obj.area + " м²" : ""}
      `);
    }
  });
}
// Храним объекты в памяти
let objects = [];

// Инициализация карты
let map = L.map('mapMain').setView([41.3111, 69.2797], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// Функция для отображения объектов
function renderObjects(list) {
  const resultsDiv = document.querySelector('.results');
  resultsDiv.innerHTML = '';

  markersLayer.clearLayers();

  list.forEach(obj => {
    // карточка
    let div = document.createElement('div');
    div.className = 'result-card';
    div.innerHTML = `
      <b>${obj.title}</b><br>
      ${obj.price} у.е.<br>
      ${obj.rooms} комн., ${obj.area} м²<br>
      <a href="${obj.contact}" target="_blank">Связаться</a>
    `;
    resultsDiv.appendChild(div);

    // метка на карте
    if (obj.lat && obj.lng) {
      let marker = L.marker([obj.lat, obj.lng]).addTo(markersLayer);
      marker.bindPopup(`<b>${obj.title}</b><br>${obj.price} у.е.`);
    }
  });
}

// Добавление объекта через админку
document.querySelector('#addObject').addEventListener('click', () => {
  let title = document.querySelector('#title').value;
  let price = document.querySelector('#price').value;
  let rooms = document.querySelector('#rooms').value;
  let area = document.querySelector('#area').value;
  let lat = document.querySelector('#lat').value;
  let lng = document.querySelector('#lng').value;
  let contact = document.querySelector('#contact').value;

  if (!title || !price) {
    alert("Заполните хотя бы заголовок и цену!");
    return;
  }

  objects.push({
    title, price, rooms, area,
    lat: parseFloat(lat), lng: parseFloat(lng),
    contact
  });

  renderObjects(objects);
});
