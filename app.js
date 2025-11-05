document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------------
  // --- LÓGICA DE LOGIN ---
  // -----------------------------------------------------------------
  console.log("app.js cargado. Esperando DOMContentLoaded.");

  // Referencias al formulario de login
  const loginContainer = document.getElementById("login-container");
  const adminPanel = document.getElementById("admin-panel-content");
  const loginButton = document.getElementById("login-button");
  const loginPasswordInput = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");

  // Configuración del API
  const baseApiUrl = "https://api.ecosapp.shop";
  const ADMIN_USERNAME = "admin"; // El usuario es fijo

  // Variables de autenticación
  let authHeadersGet = {};
  let authHeadersPost = {};

  // Escuchamos el clic en el botón "Entrar"
  loginButton.addEventListener("click", () => {
    console.log("--- BOTÓN 'Entrar' PRESIONADO ---");
    const password = loginPasswordInput.value;
    if (!password) {
      loginError.textContent = "Por favor, ingresa una contraseña.";
      console.warn("Login detenido: No se ingresó contraseña.");
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Verificando...";
    loginError.textContent = "";
    console.log("Login iniciado. Deshabilitando botón.");

    const testCredentials = btoa(`${ADMIN_USERNAME}:${password}`);
    const testAuthHeader = {
      Authorization: `Basic ${testCredentials}`,
    };
    console.log("Credenciales 'Basic Auth' creadas.");

    const loginUrl = `${baseApiUrl}/api/ventas/progreso`;
    console.log("Enviando 'fetch' de autenticación a:", loginUrl);

    fetch(loginUrl, {
      method: "GET",
      headers: testAuthHeader,
    })
      .then((response) => {
        console.log("Respuesta recibida del servidor.");
        if (response.status === 401) {
          throw new Error("Contraseña incorrecta.");
        }
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
        console.log("Autenticación OK. Parseando respuesta como JSON...");
        return response.json();
      })
      .then((datosProgreso) => {
        console.log("¡LOGIN EXITOSO!");
        console.log("Datos de progreso recibidos:", datosProgreso);

        authHeadersGet = testAuthHeader;
        authHeadersPost = {
          Authorization: `Basic ${testCredentials}`,
          "Content-Type": "application/json",
        };

        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
        console.log("Panel de admin mostrado.");

        actualizarVistaProgreso(datosProgreso);

        // --- ¡LLAMADA A LA LÓGICA DE CARGA ORIGINAL! ---
        // Esta función ahora cargará todo en memoria e iniciará el renderizado por páginas.
        cargarProductosIniciales();
      })
      .catch((error) => {
        console.error("--- ERROR CATASTRÓFICO EN EL LOGIN ---");
        console.error("El objeto de error es:", error);
        if (error.message.includes("Failed to fetch")) {
          loginError.textContent = "Error de red o CORS. Revisa la consola (F12).";
        } else {
          loginError.textContent = `Error: ${error.message}`;
        }
      })
      .finally(() => {
        console.log("--- Bloque 'finally' del login ejecutado. ---");
        loginButton.disabled = false;
        loginButton.textContent = "Entrar";
      });
  });

  // -----------------------------------------------------------------
  // --- CÓDIGO DEL PANEL DE ADMIN ---
  // -----------------------------------------------------------------

  // --- Referencias a los elementos del DOM ---
  const grid = document.getElementById("product-grid");
  const searchInput = document.getElementById("search-input");
  const modalOverlay = document.getElementById("sell-modal-overlay");
  const modalProductName = document.getElementById("modal-product-name");
  const modalProductIdInput = document.getElementById("modal-product-id");
  const modalQuantityInput = document.getElementById("modal-quantity");
  const modalPriceInput = document.getElementById("modal-price");
  const storeSelectorContainer = document.getElementById("store-selector-container");
  const sellForm = document.getElementById("sell-form");
  const closeBtn = document.querySelector(".close-btn");
  const progressBarInner = document.getElementById("progress-bar-inner");
  const progressBarText = document.getElementById("progress-bar-text");
  const infoUltimoCiclo = document.getElementById("info-ultimo-ciclo");
  const dialog = document.getElementById("my-dialog");
  const closeButton = document.getElementById("close-dialog-btn");
  const progressBarClickableArea = document.getElementById("progress-bar-clickable-area");
  const salesTableBody = document.getElementById("sales-table-body");

  // --- ¡NUEVA LÓGICA DE RENDERIZADO HÍBRIDO! ---
  let allProducts = []; // Aquí se guardarán los 175 productos
  let filteredProducts = []; // Aquí se guarda el resultado de la búsqueda
  let renderPageIndex = 0; // El índice de la "página" actual que estamos mostrando
  const renderPageSize = 20; // Cuántos productos dibujar a la vez
  let isLoading = false; // Para evitar cargas duplicadas en el scroll
  let searchTimer; // Para el debounce del buscador

  // --- Funciones (Diálogo y Progreso - SIN CAMBIOS) ---
  // (Tu código original, funciona perfecto)
  const renderUltimasVentas = (ventas) => {
    salesTableBody.innerHTML = "";
    if (!ventas || ventas.length === 0) {
      salesTableBody.innerHTML = '<tr><td colspan="3">No se encontraron ventas recientes.</td></tr>';
      return;
    }
    ventas.forEach((venta) => {
      const producto = venta.nombreProducto || "Producto no disponible";
      const monto = `$${Number(venta.montoTotal).toFixed(2)}`;
      const fecha = new Date(venta.fechaVenta).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const filaHTML = `
                <tr>
                    <td>${producto}</td>
                    <td>${monto}</td>
                    <td>${fecha}</td>
                </tr>
            `;
      salesTableBody.innerHTML += filaHTML;
    });
  };

  progressBarClickableArea.addEventListener("click", () => {
    dialog.showModal();
    salesTableBody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
    console.log("Abriendo diálogo de últimas ventas. Cargando datos...");

    fetch(`${baseApiUrl}/api/ventas/ultimas`, {
      method: "GET",
      headers: authHeadersGet,
    })
      .then((response) => {
        if (response.status === 401) throw new Error("Error de autenticación. Revisa tus credenciales.");
        if (!response.ok) throw new Error("No se pudieron cargar las ventas.");
        return response.json();
      })
      .then((data) => {
        console.log("Últimas ventas cargadas:", data);
        renderUltimasVentas(data);
      })
      .catch((error) => {
        console.error("Error al cargar últimas ventas:", error);
        salesTableBody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
      });
  });

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  const actualizarVistaProgreso = (datosProgreso) => {
    if (!datosProgreso) {
      console.warn("actualizarVistaProgreso fue llamada sin datos.");
      return;
    }
    console.log("Actualizando vista de progreso...");
    const progreso = datosProgreso.progresoActual || 0;
    const porcentaje = (progreso / 1000) * 100;
    progressBarInner.style.width = `${porcentaje}%`;
    progressBarText.textContent = `$${progreso.toFixed(2)} / $1000`;

    if (datosProgreso.ventaQueCompletoCiclo) {
      const venta = datosProgreso.ventaQueCompletoCiclo;
      const fechaVenta = new Date(venta.fechaVenta);
      const opcionesFecha = { year: "numeric", month: "long", day: "numeric" };
      const fechaFormateada = fechaVenta.toLocaleDateString("es-MX", opcionesFecha);
      const monto = venta.precioTotal || 0;
      infoUltimoCiclo.textContent = `El último reparto se completó el ${fechaFormateada} con la venta #${
        venta.id
      } (Monto: $${monto.toFixed(2)}).`;
    } else {
      infoUltimoCiclo.textContent = `Aún no se ha completado el primer reparto. ¡Vamos por ello! 🚀`;
    }
  };

  // --- ¡REEMPLAZO! Se van 'renderProducts' y 'filterProducts' ---

  // NUEVA: Función para "dibujar" UNA tarjeta de producto
  const drawProductCardAdmin = (producto) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.id = producto.id;
    card.dataset.nombre = producto.nombre;
    card.dataset.stock = producto.cantidad;
    card.dataset.precio = producto.precio;
    card.innerHTML = `
            <img src="data:image/jpeg;base64,${producto.foto}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <div class="product-info">
                <span class="price">$${producto.precio.toFixed(2)} MXN</span>
                <span class="stock">Stock Total: ${producto.cantidad}</span>
            </div>
            <div class="product-actions">
                <button class="sell-btn">Vender</button>
            </div>
        `;
    grid.appendChild(card); // Importante: AÑADE, no borra.
  };

  // NUEVA: Función para renderizar la "siguiente página" de productos
  const renderNextPage = () => {
    if (isLoading) return; // Evitar cargas duplicadas
    isLoading = true;
    console.log(`Renderizando página del cliente #${renderPageIndex}`);

    const start = renderPageIndex * renderPageSize;
    const end = start + renderPageSize;

    // Sacamos la "rebanada" de productos del array filtrado
    const pageProducts = filteredProducts.slice(start, end);

    if (pageProducts.length === 0) {
      console.log("No hay más productos que renderizar.");
      if (renderPageIndex === 0) {
        // Si es la página 0 y no hay nada
        grid.innerHTML = '<p class="info-message">No se encontraron productos.</p>';
      }
      isLoading = false;
      return; // No hay más que mostrar
    }

    // Dibujamos solo esa página
    pageProducts.forEach(drawProductCardAdmin);

    renderPageIndex++; // Avanzamos el índice para la próxima llamada
    isLoading = false;
  };

  // NUEVA: Función de búsqueda que filtra el array local
  const filterProductsClientSide = () => {
    const searchTerm = searchInput.value.toLowerCase();
    console.log(`Filtrando localmente: "${searchTerm}"`);

    // Filtramos el array maestro 'allProducts'
    filteredProducts = allProducts.filter((p) => p.nombre.toLowerCase().includes(searchTerm));

    // Reiniciamos el grid y la paginación
    grid.innerHTML = "";
    renderPageIndex = 0;

    // Renderizamos la primera página de los resultados
    renderNextPage();
  };

  // --- Funciones del Modal (SIN CAMBIOS) ---
  // (Tu código original, funciona perfecto)
  const openSellModal = async (productoId, productoNombre, defaultPrice) => {
    console.log(`Abriendo modal para vender: ${productoNombre} (ID: ${productoId})`);
    modalProductName.textContent = productoNombre;
    modalProductIdInput.value = productoId;
    modalPriceInput.value = defaultPrice;
    modalQuantityInput.value = "1";
    storeSelectorContainer.innerHTML = '<p class="loading-stores">Cargando tiendas...</p>';
    modalOverlay.classList.remove("hidden");

    try {
      const response = await fetch(`${baseApiUrl}/api/inventarios/producto/${productoId}`, {
        method: "GET",
        headers: authHeadersGet,
      });
      if (response.status === 401) throw new Error("Error de autenticación.");
      if (!response.ok) throw new Error("No se pudieron cargar los inventarios.");

      const inventarios = await response.json();
      console.log("Inventarios recibidos:", inventarios);

      if (inventarios.length > 0) {
        let selectHTML = '<select id="modal-store-select" required>';
        let tiendasConStock = 0;
        inventarios.forEach((inv) => {
          if (inv.cantidad > 0) {
            tiendasConStock++;
            selectHTML += `<option value="${inv.tienda.id}" data-max-stock="${inv.cantidad}">
                                ${inv.tienda.nombre} (Stock: ${inv.cantidad})
                            </option>`;
          }
        });
        selectHTML += "</select>";

        if (tiendasConStock > 0) {
          storeSelectorContainer.innerHTML = selectHTML;
          const storeSelect = document.getElementById("modal-store-select");
          updateMaxQuantity();
          storeSelect.addEventListener("change", updateMaxQuantity);
        } else {
          storeSelectorContainer.innerHTML =
            '<p class="error-message">Este producto está agotado en todas las tiendas.</p>';
        }
      } else {
        storeSelectorContainer.innerHTML = '<p class="error-message">Este producto no está en ninguna tienda.</p>';
      }
    } catch (error) {
      console.error("Error cargando inventarios del modal:", error);
      storeSelectorContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
  };

  const updateMaxQuantity = () => {
    const storeSelect = document.getElementById("modal-store-select");
    if (storeSelect) {
      const selectedOption = storeSelect.options[storeSelect.selectedIndex];
      modalQuantityInput.max = selectedOption.dataset.maxStock;
      console.log(`Max. stock actualizado a: ${modalQuantityInput.max}`);
    }
  };

  const closeSellModal = () => {
    modalOverlay.classList.add("hidden");
  };

  const handleSellSubmit = (event) => {
    event.preventDefault();
    console.log("Formulario de venta enviado.");

    const productoId = modalProductIdInput.value;
    const storeSelect = document.getElementById("modal-store-select");

    if (!storeSelect) {
      alert("Por favor, selecciona una tienda válida.");
      console.warn("Venta cancelada: No hay 'storeSelect' (probablemente no hay stock).");
      return;
    }

    const tiendaId = storeSelect.value;
    const cantidad = parseInt(modalQuantityInput.value, 10);
    const precioVendido = parseFloat(modalPriceInput.value);

    if (cantidad <= 0 || precioVendido < 0) {
      alert("La cantidad y el precio deben ser valores positivos.");
      return;
    }

    const datosVenta = {
      productoId: parseInt(productoId, 10),
      tiendaId: parseInt(tiendaId, 10),
      cantidad: cantidad,
      precioVendido: precioVendido,
    };
    console.log("Enviando datos de venta al API:", datosVenta);

    fetch(`${baseApiUrl}/api/ventas`, {
      method: "POST",
      headers: authHeadersPost,
      body: JSON.stringify(datosVenta),
    })
      .then((response) => {
        if (response.status === 401) throw new Error("Error de autenticación.");
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text || "Error desconocido del servidor");
          });
        }
        return response.json();
      })
      .then((datosProgreso) => {
        console.log("¡Venta registrada! Nuevos datos de progreso:", datosProgreso);
        alert(`¡Venta registrada con éxito!`);
        closeSellModal();
        const ventaRecienRegistrada = datosProgreso.ventaRecienRegistrada;

        // --- ¡Llamada a la función MODIFICADA! ---
        updateProductInUI(ventaRecienRegistrada.producto.id, ventaRecienRegistrada.cantidadVendida);
        actualizarVistaProgreso(datosProgreso);
      })
      .catch((error) => {
        console.error("Error al registrar la venta:", error);
        alert(`Error: ${error.message}`);
      });
  };

  // --- ¡MODIFICADO! ---
  // Esta función ahora actualiza el array 'allProducts' Y el DOM.
  const updateProductInUI = (productId, cantidadVendida) => {
    console.log(`Actualizando UI: Producto ${productId} vendió ${cantidadVendida} unidades.`);

    // 1. Actualizar el array maestro
    const productIndex = allProducts.findIndex((p) => p.id == productId);
    if (productIndex > -1) {
      allProducts[productIndex].cantidad -= cantidadVendida;
    }

    // 2. Actualizar el array filtrado (si es diferente)
    if (filteredProducts !== allProducts) {
      const filteredIndex = filteredProducts.findIndex((p) => p.id == productId);
      if (filteredIndex > -1) {
        filteredProducts[filteredIndex].cantidad -= cantidadVendida;
      }
    }

    // 3. Actualizar el DOM (la tarjeta visible)
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
      const newStock = parseInt(card.dataset.stock, 10) - cantidadVendida;
      card.dataset.stock = newStock;
      const stockSpan = card.querySelector(".stock");
      if (stockSpan) {
        stockSpan.textContent = `Stock Total: ${newStock}`;
      }
    }
  };

  // --- Asignación de Eventos ---

  // --- ¡MODIFICADO! El buscador ahora usa "debounce" y filtra localmente ---
  searchInput.addEventListener("input", () => {
    // Limpiamos el timer anterior
    clearTimeout(searchTimer);
    // Creamos un nuevo timer
    searchTimer = setTimeout(() => {
      filterProductsClientSide();
    }, 400); // 400ms de espera
  });

  // (Eventos del modal - SIN CAMBIOS)
  grid.addEventListener("click", (event) => {
    if (event.target.classList.contains("sell-btn")) {
      const card = event.target.closest(".product-card");
      openSellModal(card.dataset.id, card.dataset.nombre, card.dataset.precio);
    }
  });
  closeBtn.addEventListener("click", closeSellModal);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeSellModal();
    }
  });
  sellForm.addEventListener("submit", handleSellSubmit);

  // --- ¡NUEVO! Scroll Infinito (Cliente-side) ---
  window.addEventListener("scroll", () => {
    // Si el usuario está cerca del final Y no estamos cargando...
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isLoading) {
      console.log("Llegando al final, renderizando más productos locales...");
      renderNextPage(); // Renderiza la siguiente página del array local
    }
  });

  // --- Carga Inicial de Datos ---

  // ¡MODIFICADO! Esta es la función de carga original
  const cargarProductosIniciales = () => {
    console.log("Iniciando 'cargarProductosIniciales' (Carga Híbrida)...");
    grid.innerHTML = '<p class="info-message">Cargando productos...</p>';

    fetch(`${baseApiUrl}/api/productos`, {
      method: "GET",
      headers: authHeadersGet,
    })
      .then((response) => {
        console.log("Respuesta de /api/productos recibida. Estado:", response.status);
        if (response.status === 401) throw new Error("Error de autenticación (401) al cargar productos.");
        if (!response.ok) throw new Error("No se pudieron cargar los productos.");
        return response.json(); // Debería ser el ARRAY de 175 productos
      })
      .then((productos) => {
        console.log(`Productos cargados en memoria: ${productos.length} encontrados.`);
        allProducts = productos; // Guardamos todo en el array maestro
        filteredProducts = allProducts; // Al inicio, la lista filtrada es igual

        // ¡Importante! Limpiamos el grid y renderizamos solo la PRIMERA página
        grid.innerHTML = "";
        renderPageIndex = 0;
        renderNextPage();
      })
      .catch((error) => {
        console.error("--- ERROR en 'cargarProductosIniciales' ---");
        console.error(error);
        grid.innerHTML = `<p class="error-message">${error.message}</p>`;
      });
  };

  // Esta función ya no se usa, pero la dejamos por si acaso.
  const cargarProgresoInicial = async () => {
    console.warn("Función 'cargarProgresoInicial' llamada (no debería ser necesario).");

    try {
      const response = await fetch(`${baseApiUrl}/api/ventas/progreso`, {
        method: "GET",

        headers: authHeadersGet,
      });

      if (response.status === 401) throw new Error("Error de autenticación.");

      if (!response.ok) throw new Error("Error al obtener el progreso.");

      const datosProgreso = await response.json();

      actualizarVistaProgreso(datosProgreso);
    } catch (error) {
      console.error("Error al cargar el progreso inicial:", error);

      infoUltimoCiclo.textContent = `No se pudo cargar el estado del progreso. ${error.message}`;
    }
  };

  console.log("app.js: Asignación de eventos y funciones completada. Esperando login...");
});
