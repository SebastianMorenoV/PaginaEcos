// --- VARIABLES GLOBALES ---
let map;

// --- Inicializa el mapa ---
function initMap() {
  const obregon = { lat: 27.492, lng: -109.939 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: obregon,
    mapTypeControl: false,
    streetViewControl: false,
  });

  loadStoreLocations();
}

// --- Carga de tiendas ---
function loadStoreLocations() {
  //AQUI ME GUSTARIA BUSCAR EN LA BASE DE DATOS TODAS LAS UBICACIONES CON PLACE_ID DE TODAS LAS TIENDAS QUE NO SEAN Ecos de Oro Joyeria
  const tiendas = [
    {
      nombre: "Vida y Estilo ConceptStore",
      direccion: "Guerrero 300 casi esquina Tamaulipas, Col. Centro, 85000 Cd. Obregón, Sonora",
      latitud: 27.49424731192727,
      longitud: -109.94193993061745,
      place_id: "ChIJnU6tCUQVyIYRpibGGD9m7qI",
    },
    {
      nombre: "Idalia Salón",
      direccion: "Calle Blvd. C.T.M 136, Sonora, 85198, Cdad.Obregón, Son.",
      latitud: 27.44981793496795,
      longitud: -109.94054975092533,
      place_id: "ChIJk6IxeSMWyIYRMVso2o7vXkk",
    },
  ];

  const storeList = document.getElementById("store-list");
  storeList.innerHTML = "";

  const bounds = new google.maps.LatLngBounds();

  tiendas.forEach((tienda) => {
    // Agregar marcador
    const position = { lat: tienda.latitud, lng: tienda.longitud };
    const marker = new google.maps.Marker({
      position,
      map,
      title: tienda.nombre,
    });

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      tienda.nombre
    )}&query_place_id=${tienda.place_id}`;

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <strong>${tienda.nombre}</strong><br>
          ${tienda.direccion}<br>
          <a href="${mapsUrl}" target="_blank">Ver en Google Maps</a>
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    bounds.extend(position);

    // Mostrar en lista
    const li = document.createElement("li");
    li.innerHTML = `<strong>${tienda.nombre}</strong> — 
                    <a href="${mapsUrl}" target="_blank">Ver ubicación</a><br>
                    ${tienda.direccion}`;
    storeList.appendChild(li);
  });

  map.fitBounds(bounds);
}
