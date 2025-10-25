// --- VARIABLES GLOBALES ---
let map;

// --- Inicializa el mapa ---
// Google llama a esta función DESPUÉS de que la API se carga.
// Esto garantiza que el objeto "google" SÍ existe.
function initMap() {
  const obregon = { lat: 27.492, lng: -109.939 };
  
  // Asumimos que el <div id="map"> ya existe porque el script
  // se carga al final del <body> o con "defer"
  try {
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 13,
      center: obregon,
      mapTypeControl: false,
      streetViewControl: false,
    });
    
    // Una vez creado el mapa, cargamos las tiendas
    loadStoreLocations();

  } catch (e) {
    console.error("Error al crear el mapa. ¿El <div id='map'> existe?", e);
  }
}

// --- Carga de tiendas ---
function loadStoreLocations() {
  // Esta función ahora asume que la variable global 'map' ya existe.
  if (!map) {
    console.error("loadStoreLocations se llamó antes de que el mapa estuviera listo.");
    return;
  }
  
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

    // --- 💡 CORRECCIÓN DE SINTAXIS DE LA URL ---
    // Tu URL original tenía un error de sintaxis con encodeURIComponent
    const fallbackQuery = encodeURIComponent(tienda.nombre);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=$31${fallbackQuery}&query_place_id=${tienda.place_id}`;
    // --- FIN DE LA CORRECCIÓN ---

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

  // Solo ajusta los límites si hay más de una tienda,
  // si no, solo centra (se ve mejor).
  if (tiendas.length > 1) {
    map.fitBounds(bounds);
  } else if (tiendas.length === 1) {
    map.setCenter(bounds.getCenter());
    map.setZoom(15); // Un zoom más cercano para una sola tienda
  }
}