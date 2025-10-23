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

  console.log("Tiendas recibidas:", tiendas); // para verificar place_id

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

      const placeId = tienda.place_id; // usamos solo place_id
      let mapsUrlWeb = null;
      let mapsUrlApp = null;

      if (placeId) {
        mapsUrlWeb = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
        mapsUrlApp = `geo:0,0?q=place_id:${placeId}`;
      }

      const infoWindowContent = document.createElement("div");
      infoWindowContent.innerHTML = `
        <b>${tienda.nombre}</b><br>
        ${tienda.direccion || ""}<br>
        Stock: ${tienda.cantidadEnTienda}<br><br>
      `;

      if (mapsUrlApp && mapsUrlWeb) {
        const link = document.createElement("a");
        link.href = mapsUrlApp;
        link.target = "_blank";
        link.textContent = "Ver en Google Maps";
        // Fallback a web si app no se abre
        link.onclick = (e) => {
          setTimeout(() => {
            window.open(mapsUrlWeb, "_blank");
          }, 500);
        };
        infoWindowContent.appendChild(link);
      }

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

// --- 5. Función para Mostrar Detalles del Producto ---
function displayProductDetails(data) {
  const infoContainer = document.getElementById("product-info");
  const storeSection = document.getElementById("store-locations");

  document.title = `${data.nombre} - Joyeria Ecos`;

  infoContainer.innerHTML = `
        <h1>${data.nombre}</h1>
        <p class="price">$${Number(data.precio).toFixed(2)} MXN</p>
        <p class="description">${data.descripcion || "Sin descripción."}</p>
        <a href="https://wa.me/526441901249?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(
          data.nombre
        )}" target="_blank" class="order-button">Ordenar Aquí (WhatsApp)</a>
    `;

  let images = [];
  if (data.foto) {
    images.push(data.foto);
  }
  // TODO: Añadir fotos adicionales aquí cuando el backend las envíe
  if (images.length === 0) {
    images.push("placeholder.jpg");
  }
  buildSlider(images);

  storeSection.style.display = "block";
  addMarkersToMap(data.tiendasDisponibles);
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
