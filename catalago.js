// Archivo: catalago.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Lógica del Menú Hamburguesa ---
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  // ... (tu código del menú que ya te di) ..
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    menuToggle.classList.toggle("active");
    menuToggle.innerHTML = menuToggle.classList.contains("active") ? "&times;" : "&#9776;";
  });

  const bannerElement = document.querySelector(".slide-banner");

  // 1. Define tus imágenes. Asegúrate que la ruta 'imgs/' sea correcta.
  const bannerImages = ["Catalago/imgs/banner1.jpg", "Catalago/imgs/banner2.jpg", "Catalago/imgs/banner3.jpg"];

  // 2. Tu HTML empieza con 'banner3.jpg', que es el índice 2 de nuestro array (0, 1, 2)
  let currentBannerIndex = 2;

  // 3. Función para cambiar la imagen
  function changeBanner() {
    // Avanza al siguiente índice
    currentBannerIndex++;

    // Si llega al final, regresa al inicio (índice 0)
    if (currentBannerIndex >= bannerImages.length) {
      currentBannerIndex = 0;
    }

    // 4. Aplica la clase 'fade-out' para que se desvanezca
    bannerElement.classList.add("fade-out");

    // 5. Espera a que termine la animación de salida (500ms)
    setTimeout(() => {
      // 6. Cambia la fuente (src) de la imagen
      bannerElement.src = bannerImages[currentBannerIndex];

      // 7. Quita la clase 'fade-out' para que aparezca suavemente
      bannerElement.classList.remove("fade-out");
    }, 500); // IMPORTANTE: Este tiempo debe coincidir con el CSS
  }

  // 8. Llama a la función 'changeBanner' cada 5 segundos (5000 milisegundos)
  setInterval(changeBanner, 5000);
  // --- Referencias para Búsqueda (NUEVO) ---
  const searchInput = document.getElementById("product-search-input");
  const searchButton = document.getElementById("search-button");
  // --- Lógica del Catálogo y Filtros ---
  const productGrid = document.createElement("div"); // Crea un grid para los productos
  productGrid.className = "product-grid-catalogo"; // Dale una clase para CSS
  document.querySelector(".grid-layout").appendChild(productGrid); // Añádelo al layout

  const baseApiUrl = "https://api.ecosapp.shop";

  // 1. Guardamos el estado actual de la carga
  let currentState = {
    page: 1,
    limit: 24,
    searchTerm: null,
    category: null, // null o 'all' significa "todos"
    isLoading: false, // Para evitar cargas duplicadas
    hasMore: true, // Para saber si ya se cargaron todos
  };

  // 2. Función principal para cargar productos
  async function fetchProducts() {
    if (currentState.isLoading || !currentState.hasMore) return;

    currentState.isLoading = true;
    console.log(`Cargando: Página ${currentState.page}, Cat: ${currentState.category || "todos"}`);

    // Construye la URL con los parámetros
    let url = `${baseApiUrl}/api/productos/publicos?page=${currentState.page}&limit=${currentState.limit}`;
    if (currentState.category) {
      url += `&categoria=${currentState.category}`;
    }
    // <-- NUEVO: Añade el término de búsqueda si existe -->
    if (currentState.searchTerm) {
      url += `&search=${encodeURIComponent(currentState.searchTerm)}`; // encodeURIComponent es importante por si buscan "oro 14k"
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar productos.");

      const data = await response.json(); // La API devuelve un objeto 'Page'

      // Dibujamos los productos
      data.content.forEach((producto) => {
        drawProductCard(producto);
      });

      // Actualizamos el estado
      currentState.page++; // Incrementamos para la próxima carga
      currentState.hasMore = !data.last; // 'last' es true si es la última página
    } catch (error) {
      console.error(error);
    } finally {
      currentState.isLoading = false;
    }
  }

  // 3. Función para "dibujar" una tarjeta de producto
  function drawProductCard(producto) {
    // --- MODIFICADO ---
    // 1. Ya no es un <div>, es un <a> (link)
    const card = document.createElement("a");
    card.className = "product-card-public"; // La clase CSS es la misma

    // 2. ¡La parte clave! Creamos el link a la página de detalles
    //    Pasamos el ID del producto como un "query parameter"
    card.href = `producto.html?id=${producto.id}`;
    // --- FIN DE MODIFICACIÓN ---

    // El frontend recibe la foto en Base64
    const fotoSrc = producto.foto ? `data:image/jpeg;base64,${producto.foto}` : "placeholder.jpg";

    card.innerHTML = `
            <img src="${fotoSrc}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p class="product-desc">${producto.descripcion}</p>
            <p class="product-price">$${Number(producto.precio).toFixed(2)} MXN</p>
        `;
    productGrid.appendChild(card);
  }

  // 4. Lógica para los Filtros (tus links del nav)
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === "about.html") {
      return; // Si es "about.html", no le añadimos el listener y nos lo saltamos.
    }
    link.addEventListener("click", (e) => {
      e.preventDefault(); // Evita que la página recargue

      const newCategory = e.target.textContent.toLowerCase(); // ej: "pulseras"

      // Si ya estamos en esa categoría, no hacemos nada
      if (currentState.category === newCategory) return;

      // Reseteamos el estado
      currentState.category = newCategory;
      currentState.searchTerm = null;
      currentState.page = 1;
      currentState.hasMore = true;
      searchInput.value = "";

      // Limpiamos el grid
      productGrid.innerHTML = "";

      // Ocultamos el menú móvil (si está abierto)
      navLinks.classList.remove("active");
      menuToggle.classList.remove("active");
      menuToggle.innerHTML = "&#9776;";

      // Cargamos los nuevos productos
      fetchProducts();
    });
  });

  // --- NUEVO: Lógica para los Botones de Filtro (Materiales/Características) ---
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const newSearchTerm = e.target.dataset.filter; // Obtiene el valor de 'data-filter' (ej: "oro", "plata", "" para Todos)

      // Evita recargar si ya está seleccionado
      if (currentState.searchTerm === (newSearchTerm || null) && !currentState.category) return;

      // Resetea estado para BÚSQUEDA PREDEFINIDA
      currentState.searchTerm = newSearchTerm || null; // "" se convierte en null
      currentState.category = null; // Limpia la categoría
      currentState.page = 1;
      currentState.hasMore = true;
      searchInput.value = newSearchTerm; // (Opcional) Pone el término en el input
      productGrid.innerHTML = ""; // Limpia grid

      // Actualiza el botón activo
      document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");

      // (Opcional: Deselecciona categoría activa en .nav-links si la hubiera)

      fetchProducts();
    });
  }); // 1. Definimos una variable para nuestro "temporizador" fuera de los eventos

  // --- NUEVO: Lógica para el Buscador DINÁMICO (con Debounce) ---

  let debounceTimer; // 2. Tu función actual. NO necesita cambios, ya funciona perfecto.

  function handleSearch() {
    const searchTerm = searchInput.value.trim();

    if (currentState.searchTerm === searchTerm && !currentState.category) return;

    currentState.searchTerm = searchTerm || null;
    currentState.category = null;
    currentState.page = 1;
    currentState.hasMore = true;

    productGrid.innerHTML = ""; // Actualiza botón activo en .filter-buttons
    document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
    const matchingButton = document.querySelector(`.filter-btn[data-filter="${searchTerm.toLowerCase()}"]`);
    if (matchingButton) {
      matchingButton.classList.add("active");
    } else if (!searchTerm) {
      document.querySelector('.filter-btn[data-filter=""]').classList.add("active");
    }

    fetchProducts();
  } // 3. ¡La Magia! Escuchamos el evento "input"

  searchInput.addEventListener("input", (e) => {
    // Cada vez que el usuario teclea algo, limpiamos el temporizador anterior
    clearTimeout(debounceTimer); // Creamos un nuevo temporizador

    debounceTimer = setTimeout(() => {
      // Cuando pasen 400ms SIN que el usuario teclee nada nuevo,
      // se ejecuta la búsqueda.
      handleSearch();
    }, 400); // 400ms es un buen tiempo de espera
  }); // 4. (Opcional pero recomendado) Mantenemos los eventos de Click y Enter // // Por si el usuario prefiere usar el botón

  searchButton.addEventListener("click", () => {
    // Limpiamos el timer para que no se duplique la búsqueda
    clearTimeout(debounceTimer);
    handleSearch();
  }); // Por si el usuario presiona "Enter"

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      // Limpiamos el timer para que no se duplique la búsqueda
      clearTimeout(debounceTimer);
      handleSearch();
    }
  });

  searchButton.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
  // 5. Lógica de "Infinite Scroll"
  window.addEventListener("scroll", () => {
    // Si el usuario está cerca del final Y no estamos cargando Y hay más por cargar...
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
      !currentState.isLoading &&
      currentState.hasMore
    ) {
      fetchProducts(); // Carga la siguiente página
    }
  });

  // --- Carga Inicial ---
  fetchProducts(); // Carga la página 1 de "todos" al abrir la web
});
