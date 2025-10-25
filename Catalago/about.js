// --- VARIABLES GLOBALES ---
let map;

/**
 * 1. Inicializa el mapa
 * Google llama a esta función cuando termina de cargar.
 * La dejamos vacía para evitar errores de "mapDiv null".
 */
function initMap() {
  // No hacemos nada aquí. Crearemos el mapa en loadStoreLocations
  // para asegurarnos de que el <div> ya existe.
}

/**
 * 2. Carga las tiendas desde la API y las pone en el mapa
 */
async function loadStoreLocations() {
  const storeList = document.getElementById("store-list");
  storeList.innerHTML = "<li>Cargando ubicaciones...</li>";

  // --- 💡 INICIO DE LA MODIFICACIÓN ---
  
  // 1. Creamos el mapa AQUÍ, asegurándonos de que <div id="map"> existe.
  if (!map) {
    const obregon = { lat: 27.492, lng: -109.939 };
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 13,
      center: obregon,
      mapTypeControl: false,
      streetViewControl: false,
    });
  }

  try {
    // 2. Definimos la URL de tu API.
    // DEBES CREAR ESTE ENDPOINT EN TU BACKEND
    const baseApiUrl = "https://api.ecosapp.shop";
    // Este endpoint debe devolver la lista de tiendas
    // que NO son "Ecos de Oro Joyeria" y SÍ tienen place_id.
    const url = `${baseApiUrl}/api/puntos-de-venta`; // O como se llame tu endpoint

    // 3. Hacemos el fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("No se pudieron cargar las ubicaciones.");
    }
    const tiendas = await response.json();

    // 4. Verificamos si hay tiendas
    if (!tiendas || tiendas.length === 0) {
      storeList.innerHTML = "<li>No hay otros puntos de venta por el momento.</li>";
      // Oculta el mapa si no hay tiendas
      document.getElementById("map").style.display = "none";
      return;
    }

    // 5. El resto de tu código para procesar la lista
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

      // CORRECCIÓN de la URL de Google Maps
      const fallbackQuery = encodeURIComponent(tienda.nombre);
      const mapsUrl = `https://google.com/maps/search/?api=1&query=$${fallbackQuery}&query_place_id=${tienda.place_id}`;

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

  } catch (error) {
    console.error("Error al cargar tiendas:", error);
    storeList.innerHTML = "<li>Error al cargar las ubicaciones. Intenta de nuevo más tarde.</li>";
  }
  // --- 💡 FIN DE LA MODIFICACIÓN ---
}

/**
 * 3. Carga Inicial
 * Espera a que el HTML esté listo y LUEGO llama a la función
 */
document.addEventListener("DOMContentLoaded", () => {
  loadStoreLocations();
});