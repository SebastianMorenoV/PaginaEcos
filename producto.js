// --- Variables Globales ---
let map; // Instancia del mapa de Google
let currentSlideIndex = 0;
let productImages = [];
let slideInterval;

// --- 1. Obtener ID del Producto de la URL ---
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// --- 2. Inicialización de Google Maps ---
function initMap() {}

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
            <button id="prev-slide"><</button>
            <button id="next-slide">></button>
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

// --- 4. Función para Añadir Marcadores al Mapa ---
function addMarkersToMap(tiendas) {
  const defaultLocation = { lat: 27.496, lng: -109.94 };
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: defaultLocation,
    mapTypeControl: false,
    streetViewControl: false,
  });
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

      console.log(`Procesando tienda: ${tienda.nombre}`, tienda);

      let mapsUrl = null;
      const fallbackQuery = encodeURIComponent(tienda.nombre);

      if (tienda.place_id) {
        // CORRECCIÓN: Esta es la URL correcta para el Place ID
        mapsUrl = `https://google.com/maps/search/?api=1&query=${fallbackQuery}&query_place_id=${tienda.place_id}`;
        console.log(`-> Generando enlace para '${tienda.nombre}' con Place ID: ${tienda.place_id}`);
      } else {
        console.warn(`-> Tienda '${tienda.nombre}' NO tiene Place ID. No se generará enlace de mapa.`);
      }

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

// --- 5. Función para Mostrar Detalles del Producto (CORREGIDA) ---
function displayProductDetails(data) {
  const infoContainer = document.getElementById("product-info");
  const storeSection = document.getElementById("store-locations");

  document.title = `${data.nombre} - Joyeria Ecos`;

  // --- Lógica del Botón WhatsApp (CORREGIDA) ---

  // 1. Obtenemos la URL actual de la página
  const pageUrl = window.location.href;

  // 2. Creamos el mensaje con salto de línea
  const whatsappMessage = `Hola, me interesa este producto: ${data.nombre}\n\n${pageUrl}`;

  // 3. Codificamos TODO el mensaje
  const encodedMessage = encodeURIComponent(whatsappMessage);

  // 4. Creamos la URL final de WhatsApp (¡CORREGIDA!)
  const whatsappUrl = `https://wa.me/526441901249?text=${encodedMessage}`;

  // 5. Inyectamos el HTML
  infoContainer.innerHTML = `
        <h1>${data.nombre}</h1>
        <p class="price">$${Number(data.precio).toFixed(2)} MXN</p>
        <p class="description">${data.descripcion || "Sin descripción."}</p>
        <a href="${whatsappUrl}" target="_blank" class="order-button">Ordenar Aquí (WhatsApp)</a>
    `;

  // --- Lógica del Slider (LA VERSIÓN CORRECTA) ---
  let images = [];

  // 1. Añade la imagen principal (data.foto) primero
  if (data.foto) {
    images.push(data.foto);
  }

  // 2. Añade todas las imágenes secundarias
  if (data.imagenesSecundarias && data.imagenesSecundarias.length > 0) {
    // Opcional: ordenar por la columna 'orden'
    data.imagenesSecundarias.sort((a, b) => a.orden - b.orden);

    // Extrae solo la cadena Base64 de cada objeto
    data.imagenesSecundarias.forEach((imgObj) => {
      // Asumiendo que el DTO de Spring envía los bytes como 'imagenData'
      images.push(imgObj.imagenData);
    });
  }

  // 3. Si no hay NADA, usa el placeholder
  if (images.length === 0) {
    images.push("placeholder.jpg");
  }

  // 4. Llama a buildSlider con el array completo
  buildSlider(images);

  // --- Lógica del Mapa Condicional ---
  const tiendas = data.tiendasDisponibles;
  const noHayTiendas = !tiendas || tiendas.length === 0;
  const soloEcos = tiendas && tiendas.length === 1 && tiendas[0].nombre === "Ecos de Oro Joyeria";

  if (noHayTiendas || soloEcos) {
    // Si no hay tiendas FÍSICAS, muestra mensaje personalizado
    storeSection.style.display = "block";
    storeSection.innerHTML = `
      <h2>Puntos de Venta</h2>
      <p class="no-store-message">
        Este producto no se encuentra en ningun punto de venta, puedes ordenarlo a tu domicilio contactandonos haciendo click en el boton.
      </p>
    `;
  } else {
    // Si hay tiendas físicas, muestra el mapa
    storeSection.style.display = "block";
    addMarkersToMap(data.tiendasDisponibles);
  }

  if (data.categoria) {
    // Y pasamos ese string directamente
    fetchRelatedProducts(data.categoria, productId);
  } else {
    // Si no hay categoría, oculta la sección
    console.warn("Este producto no tiene categoría, no se mostrarán relacionados.");
    document.getElementById("related-products").style.display = "none";
  }
}
/**
 * Busca productos en la misma categoría, los barajea y muestra 8.
 * @param {string} categoriaNombre - El nombre de la categoría (ej: "cadenas")
 * @param {string|number} currentProductId - El ID del producto actual (para excluirlo)
 */
async function fetchRelatedProducts(categoriaNombre, currentProductId) {
  const relatedSection = document.getElementById("related-products");
  const baseApiUrl = "https://api.ecosapp.shop";

  // --- 💡 MODIFICACIÓN 1: Definimos límites ---
  const displayLimit = 8; // Límite final de productos a mostrar
  const poolSize = 30; // Cantidad a pedir para tener de dónde barajear

  // --- 💡 MODIFICACIÓN 2: URL CORREGIDA ---
  // Volvemos a filtrar por 'categoria'
  // Y pedimos 'poolSize' (30) productos DE ESA CATEGORÍA
  const url = `${baseApiUrl}/api/productos/publicos?categoria=${encodeURIComponent(
    categoriaNombre
  )}&limite=${poolSize}&excluir=${currentProductId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("No se pudieron cargar los productos relacionados.");
    }
    const products = await response.json();

    let productList = products.content ? products.content : products;

    if (productList && productList.length > 0) {
      // --- 💡 MODIFICACIÓN 3: Barajear la lista (Algoritmo Fisher-Yates) ---
      // Esto reordena la lista 'productList' (que solo tiene productos de la misma categoría)
      for (let i = productList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [productList[i], productList[j]] = [productList[j], productList[i]];
      }

      // --- 💡 MODIFICACIÓN 4: Cortamos la lista al límite deseado ---
      // Tomamos los primeros 'displayLimit' (8) productos de la lista ya barajada
      const finalProducts = productList.slice(0, displayLimit);

      relatedSection.style.display = "block"; // Muestra la sección
      displayRelatedProducts(finalProducts); // Llama a la función que los "dibuja"
    } else {
      // Si no hay relacionados, oculta la sección
      relatedSection.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching related products:", error);
    relatedSection.style.display = "none"; // Oculta si hay error
  }
}
/**
 * "Dibuja" las tarjetas de productos en el grid
 * @param {Array} products - Lista de productos a mostrar
 */
function displayRelatedProducts(products) {
  const grid = document.getElementById("related-products-grid");
  grid.innerHTML = ""; // Limpia el mensaje "Cargando..."

  products.forEach((product) => {
    // Maneja la imagen (Base64 o URL)
    let imgSrc = "placeholder.jpg"; // Imagen por defecto
    if (product.foto) {
      imgSrc = product.foto.startsWith("http") ? product.foto : `data:image/jpeg;base64,${product.foto}`;
    }

    // Crea la tarjeta como un enlace
    const card = document.createElement("a");
    card.href = `producto.html?id=${product.id}`; // Enlace al detalle
    card.className = "related-product-card";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${product.nombre}">
      <div class="related-product-card-info">
        <h4>${product.nombre}</h4>
        <p class="price">$${Number(product.precio).toFixed(2)} MXN</p>
      </div>
    `;

    grid.appendChild(card);
  });
}

// --- 6. Carga de Datos Inicial (Dentro de DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", async () => {
  const detailContent = document.getElementById("product-detail-content");

  // --- Lógica del Lightbox (Vista Previa de Imagen) ---
  const sliderContainer = document.getElementById("image-slider");
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = document.querySelector(".lightbox-close");

  if (sliderContainer && lightbox && lightboxImg && closeBtn) {
    // 1. Abrir el lightbox
    sliderContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("slider-image")) {
        const imgSrc = e.target.getAttribute("src");
        lightboxImg.setAttribute("src", imgSrc);
        lightbox.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
    });

    // 2. Función para cerrar
    function closeLightbox() {
      lightbox.style.display = "none";
      document.body.style.overflow = "auto";
    }

    // 3. Cerrar con el botón X
    closeBtn.addEventListener("click", closeLightbox);

    // 4. Cerrar haciendo clic en el fondo
    lightbox.addEventListener("click", (e) => {
      if (e.target.id === "image-lightbox") {
        closeLightbox();
      }
    });
  }
  // --- Fin Lógica del Lightbox ---

  if (!productId) {
    detailContent.innerHTML = '<h1 class="error-message">Error: ID de producto no válido.</h1>';
    return;
  }

  // Cambia a tu URL de producción
  const baseApiUrl = "https://api.ecosapp.shop";
  const url = `${baseApiUrl}/api/productos/publicos/${productId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) throw new Error("Producto no encontrado.");
      throw new Error(`Error ${response.status} al cargar el producto.`);
    }
    const productData = await response.json();
    console.log("Datos del producto:", productData);
    displayProductDetails(productData);
  } catch (error) {
    console.error(error);
    detailContent.innerHTML = `<h1 class="error-message">Error: ${error.message}</h1>`;
    const storeLocations = document.getElementById("store-locations");
    if (storeLocations) {
      storeLocations.style.display = "none";
    }
  }
});
