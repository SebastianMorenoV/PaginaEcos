// --- VARIABLES GLOBALES ---
let map;

/**
 * 1. Inicializa el mapa (Función Global)
 * Google llama a esta función OBLIGATORIAMENTE porque
 * se lo pides en la URL del script.
 * La dejamos vacía para evitar el error "mapDiv null".
 * La lógica real se llama en DOMContentLoaded.
 */
function initMap() {
  // No hacer nada aquí.
}

/**
 * 2. Carga de tiendas
 * Esta función ahora recibe la instancia del mapa como parámetro.
 */
function loadStoreLocations(mapInstance) {
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
      map: mapInstance, // Usamos la instancia que recibimos
      title: tienda.nombre,
    });

    // --- 💡 CORRECCIÓN DE LA URL DE GOOGLE MAPS ---
    // La URL que tenías estaba mal formada.
    const fallbackQuery = encodeURIComponent(tienda.nombre);
    const mapsUrl = `http://googleusercontent.com/maps/google.com/10${fallbackQuery}&query_place_id=${tienda.place_id}`;
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
      infoWindow.open(mapInstance, marker); // Usamos la instancia
    });

    bounds.extend(position);

    // Mostrar en lista
    const li = document.createElement("li");
    li.innerHTML = `<strong>${tienda.nombre}</strong> — 
                    <a href="${mapsUrl}" target="_blank">Ver ubicación</a><br>
                    ${tienda.direccion}`;
    storeList.appendChild(li);
  });

  mapInstance.fitBounds(bounds); // Usamos la instancia
}

/**
 * 3. Carga Inicial Segura
 * Esto espera a que el HTML (incluido <div id="map">) esté listo
 * ANTES de intentar crear el mapa.
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Ahora sí creamos el mapa, porque <div id="map"> ya existe.
  const obregon = { lat: 27.492, lng: -109.939 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: obregon,
    mapTypeControl: false,
    streetViewControl: false,
  });

  // 2. Llamamos a loadStoreLocations y le pasamos el mapa que acabamos de crear.
  loadStoreLocations(map);
});