// Массив для хранения объектов
let objects = [];

// Инициализация карты
const map = L.map('map').setView([41.3111, 69.2797], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

let selectedCoords = null;

// При клике на карту выбираем координаты
map.on('click', (e) => {
  selectedCoords = e.latlng;
  L.marker(selectedCoords).addTo(map)
    .bindPopup("Выбрана точка")
    .openPopup();
});

// Добавление нового объекта
document.getElementById('addObject').addEventListener('click', () => {
  const title = document.getElementById('title').value;
  const price = document.getElementById('price').value;
  const rooms = document.getElementById('rooms').value;
  const area = document.getElementById('area').value;
  const category = document.getElementById('category').value;
  const status = document.getElementById('status').value;
  const contact = document.getElementById('contact').value;

  const photoInput = document.getElementById('photo');
  let photos = [];
  for (let file of photoInput.files) {
    photos.push(URL.createObjectURL(file));
  }

  if (!title || !price || !rooms || !area || !category || !status || !selectedCoords) {
    alert("Заполните все обязательные поля и укажите точку на карте!");
    return;
  }

  const obj = {
    title,
    price,
    rooms,
    area,
    category,
    status,
    contact,
    coords: selectedCoords,
    photos
  };

  objects.push(obj);
  renderResults(objects);
  addMarker(obj);
});

// Рендер списка объектов
function renderResults(list) {
  const resultsList = document.getElementById('resultsList');
  resultsList.innerHTML = '';
  list.forEach((obj, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <b>${obj.title}</b> (${obj.category}, ${obj.status})<br>
      ${obj.price} у.е., ${obj.rooms} комн., ${obj.area} м²<br>
      <a href="${obj.contact}" target="_blank">Связаться</a><br>
      ${obj.photos.map(p => `<img src="${p}" style="width:100px">`).join('')}
    `;
    resultsList.appendChild(li);
  });
}

// Добавление маркера на карту
function addMarker(obj) {
  const marker = L.marker(obj.coords).addTo(map);
  marker.bindPopup(`
    <b>${obj.title}</b><br>
    ${obj.price} у.е.<br>
    ${obj.rooms} комн., ${obj.area} м²
  `);
}

// Фильтр
document.getElementById('applyFilter').addEventListener('click', () => {
  const category = document.getElementById('filterCategory').value;
  const status = document.getElementById('filterStatus').value;
  const priceMin = document.getElementById('filterPriceMin').value;
  const priceMax = document.getElementById('filterPriceMax').value;
  const roomsMin = document.getElementById('filterRoomsMin').value;
  const roomsMax = document.getElementById('filterRoomsMax').value;

  let filtered = objects.filter(o => {
    return (category === "Любая" || o.category === category) &&
           (status === "Любой" || o.status === status) &&
           (!priceMin || o.price >= priceMin) &&
           (!priceMax || o.price <= priceMax) &&
           (!roomsMin || o.rooms >= roomsMin) &&
           (!roomsMax || o.rooms <= roomsMax);
  });

  renderResults(filtered);
});

// Сброс фильтра
document.getElementById('resetFilter').addEventListener('click', () => {
  renderResults(objects);
});
