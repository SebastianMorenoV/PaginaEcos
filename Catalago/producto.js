// --- Variables Globales ---
let map; // Instancia del mapa de Google
let currentSlideIndex = 0;
let productImages = [];
let slideInterval;

// --- 1. Obtener ID del Producto de la URL ---
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// --- 2. Inicialización de Google Maps (¡AHORA ES GLOBAL!) ---
// Google llama a esta función automáticamente cuando su script termina de cargar.
function initMap() {
  const defaultLocation = { lat: 27.496, lng: -109.94 }; // Coordenadas de Obregón

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: defaultLocation,
    mapTypeControl: false,
    streetViewControl: false,
  });
  // La función que añade los marcadores será llamada después,
  // cuando los datos del producto se hayan cargado.
}

// --- 3. Funciones del Slider de Imágenes ---
function buildSlider(images) {
  const sliderContainer = document.getElementById("image-slider");
  if (!images || images.length === 0) {
    sliderContainer.innerHTML = "<p>No hay imágenes disponibles.</p>";
    return;
  }
  productImages = images;
  let sliderHTML = "";
  let dotsHTML = "";
  images.forEach((imgSrc, index) => {
    const fullSrc = imgSrc.startsWith("http") ? imgSrc : `data:image/jpeg;base64,${imgSrc}`;
    sliderHTML += `<img src="${fullSrc}" class="slider-image ${index === 0 ? "active" : ""}" alt="Producto imagen ${
      index + 1
    }">`;
    dotsHTML += `<span class="slider-dot ${index === 0 ? "active" : ""}" data-index="${index}"></span>`;
  });
  sliderContainer.innerHTML = `
        ${sliderHTML}
        <div class="slider-controls">
            <button id="prev-slide">&lt;</button>
            <button id="next-slide">&gt;</button>
        </div>
        <div class="slider-dots">
            ${dotsHTML}
        </div>
    `;
  document.getElementById("prev-slide").addEventListener("click", prevSlide);
  document.getElementById("next-slide").addEventListener("click", nextSlide);
  document.querySelectorAll(".slider-dot").forEach((dot) => {
    dot.addEventListener("click", (e) => goToSlide(parseInt(e.target.dataset.index)));
  });
}

function showSlide(index) {
  document.querySelectorAll(".slider-image").forEach((img, i) => {
    img.classList.toggle("active", i === index);
  });
  document.querySelectorAll(".slider-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
  currentSlideIndex = index;
}

function nextSlide() {
  let nextIndex = (currentSlideIndex + 1) % productImages.length;
  showSlide(nextIndex);
}

function prevSlide() {
  let prevIndex = (currentSlideIndex - 1 + productImages.length) % productImages.length;
  showSlide(prevIndex);
}

function goToSlide(index) {
  showSlide(index);
}

// --- 4. Función para Añadir Marcadores al Mapa (CORREGIDA) ---
function addMarkersToMap(tiendas) {
  if (!map) {
    console.warn("Mapa no listo aún, reintentando en 500ms...");
    setTimeout(() => addMarkersToMap(tiendas), 500);
    return;
  }
  if (!tiendas || tiendas.length === 0) {
    document.getElementById("store-locations").innerHTML = "<h2>No disponible en tiendas físicas.</h2>";
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  const storeListUl = document.getElementById("store-list");
  storeListUl.innerHTML = "";

  tiendas.forEach((tienda) => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${tienda.nombre}</b>: ${tienda.direccion || "Dirección no disponible"} (Stock: ${
      tienda.cantidadEnTienda
    })`;
    storeListUl.appendChild(li);

    if (tienda.latitud != null && tienda.longitud != null) {
      const position = { lat: tienda.latitud, lng: tienda.longitud };
      const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: `${tienda.nombre} (Stock: ${tienda.cantidadEnTienda})`,
      });

      // --- INICIO DE LA CORRECCIÓN ---

      // Console log para ver los datos de cada tienda
      console.log(`Procesando tienda: ${tienda.nombre}`, tienda);

      let mapsUrl = null; // Inicia como nulo por defecto
      const fallbackQuery = encodeURIComponent(tienda.nombre); // Texto de respaldo // ❗️ CORRECCIÓN: Verificamos "place_id" (con guion bajo)

      if (tienda.place_id) {
        // ❗️ CORRECCIÓN: Usamos "place_id" para construir la URL
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=$3{fallbackQuery}&query_place_id=${tienda.place_id}`; // Log para confirmar que se usó el place_id
        console.log(`-> Generando enlace para '${tienda.nombre}' con Place ID: ${tienda.place_id}`);
      } else {
        // Log para avisar que esta tienda no tendrá enlace
        console.warn(`-> Tienda '${tienda.nombre}' NO tiene Place ID. No se generará enlace de mapa.`);
      } // El contenido del InfoWindow. // El enlace <a> solo aparecerá si mapsUrl NO es nulo.

      const infoWindowContent = `
  <div>
    <b>${tienda.nombre}</b><br>
    ${tienda.direccion || ""}<br>
    Stock: ${tienda.cantidadEnTienda}<br><br>
    ${mapsUrl ? `<a href="${mapsUrl}" target="_blank">Ver en Google Maps</a>` : ""}
  </div>
`;
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
      bounds.extend(position);
    }
  });

  if (!bounds.isEmpty()) {
    if (tiendas.filter((t) => t.latitud != null).length > 1) {
      map.fitBounds(bounds);
    } else {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    }
  } else {
    document.getElementById("map").innerHTML =
      '<p style="text-align:center; padding-top: 50px;">Ubicaciones no disponibles en el mapa.</p>';
  }
}

// --- 5. Función para Mostrar Detalles del Producto (MODIFICADA) ---
function displayProductDetails(data) {
  const infoContainer = document.getElementById("product-info");
  const storeSection = document.getElementById("store-locations");

  document.title = `${data.nombre} - Joyeria Ecos`;

  // --- INICIO DE MODIFICACIÓN (PARTE 2: Botón WhatsApp) ---

  // 1. Obtenemos la URL actual de la página (ej: https://ecos.shop/producto.html?id=123)
  const pageUrl = window.location.href;

  // 2. Creamos el mensaje. El "\n" (salto de línea) es clave.
  // WhatsApp lo convertirá en un salto de línea en el mensaje.
  const whatsappMessage = `Hola, me interesa este producto: ${data.nombre}\n\n${pageUrl}`;

  // 3. Codificamos TODO el mensaje para que sea seguro en una URL
  const encodedMessage = encodeURIComponent(whatsappMessage);

  // 4. Creamos la URL final de WhatsApp
  const whatsappUrl = `https://wa.me/526441901249?text=${encodedMessage}`;

  // 5. Inyectamos el HTML con la NUEVA URL en el botón
  infoContainer.innerHTML = `
        <h1>${data.nombre}</h1>
        <p class="price">$${Number(data.precio).toFixed(2)} MXN</p>
        <p class="description">${data.descripcion || "Sin descripción."}</p>
        <a href="${whatsappUrl}" target="_blank" class="order-button">Ordenar Aquí (WhatsApp)</a>
    `;
  // --- FIN DE MODIFICACIÓN (PARTE 2) ---

  // Esto construye el slider de imágenes (sin cambios)
  let images = [];
  if (data.foto) {
    images.push(data.foto);
  }
  if (images.length === 0) {
    images.push("placeholder.jpg");
  }
  buildSlider(images);

  // --- INICIO DE MODIFICACIÓN (PARTE 1: Mapa Condicional) ---
  const tiendas = data.tiendasDisponibles;

  // Verificamos si la lista de tiendas está vacía
  const noHayTiendas = !tiendas || tiendas.length === 0;

  // Verificamos si la ÚNICA tienda es "Ecos de Oro Joyeria"
  const soloEcos = tiendas && tiendas.length === 1 && tiendas[0].nombre === "Ecos de Oro Joyeria";

  if (noHayTiendas || soloEcos) {
    // Si no hay tiendas FÍSICAS (o solo es "Ecos"), mostramos tu mensaje personalizado.
    storeSection.style.display = "block"; // Muestra la sección

    // Reemplazamos el contenido de la sección para quitar el mapa y la lista
    storeSection.innerHTML = `
      <h2>Puntos de Venta</h2>
      <p class="no-store-message">
        Este producto no se encuentra en ningun punto de venta, puedes ordenarlo a tu domicilio contactandonos haciendo click en el boton.
      </p>
    `;
    // No llamamos a addMarkersToMap()
  } else {
    // Si hay tiendas físicas REALES, mostramos la sección y llamamos a la función del mapa
    storeSection.style.display = "block";
    addMarkersToMap(data.tiendasDisponibles);
  }
  // --- FIN DE MODIFICACIÓN (PARTE 1) ---
}

// --- 6. Carga de Datos Inicial (Dentro de DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", async () => {
  const detailContent = document.getElementById("product-detail-content");

  if (!productId) {
    detailContent.innerHTML = '<h1 class="error-message">Error: ID de producto no válido.</h1>';
    return;
  }

  // Cambia a tu URL de producción cuando subas los cambios
  const baseApiUrl = "https://api.ecosapp.shop";
  const url = `${baseApiUrl}/api/productos/publicos/${productId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) throw new Error("Producto no encontrado.");
      throw new Error(`Error ${response.status} al cargar el producto.`);
    }
    const productData = await response.json();
    displayProductDetails(productData);
  } catch (error) {
    console.error(error);
    detailContent.innerHTML = `<h1 class="error-message">Error: ${error.message}</h1>`;
    // Oculta la sección del mapa si hay un error grave
    const storeLocations = document.getElementById("store-locations");
    if (storeLocations) {
      storeLocations.style.display = "none";
    }
  }
});
