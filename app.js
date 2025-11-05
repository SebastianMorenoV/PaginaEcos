document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------------
  // --- NUEVA LÓGICA DE LOGIN ---
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

  // Estas variables se llenarán DESPUÉS de un login exitoso
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

    // Deshabilitamos el botón para evitar doble clic
    loginButton.disabled = true;
    loginButton.textContent = "Verificando...";
    loginError.textContent = ""; // Limpiamos errores
    console.log("Login iniciado. Deshabilitando botón.");

    // 1. Creamos credenciales temporales SOLO para la prueba
    const testCredentials = btoa(`${ADMIN_USERNAME}:${password}`);
    const testAuthHeader = {
      Authorization: `Basic ${testCredentials}`,
    };
    console.log("Credenciales 'Basic Auth' creadas.");

    // 2. Hacemos una llamada de prueba a un endpoint protegido
    const loginUrl = `${baseApiUrl}/api/ventas/progreso`;
    console.log("Enviando 'fetch' de autenticación a:", loginUrl);

    fetch(loginUrl, {
      method: "GET",
      headers: testAuthHeader,
    })
      .then((response) => {
        console.log("Respuesta recibida del servidor.");
        if (response.status === 401) {
          console.warn("Error 401: Autenticación fallida. Contraseña incorrecta.");
          throw new Error("Contraseña incorrecta.");
        }
        if (!response.ok) {
          console.warn(`Respuesta NO 'ok'. Estado: ${response.status}`);
          throw new Error(`Error del servidor: ${response.status}`);
        }
        console.log("Autenticación OK. Parseando respuesta como JSON...");
        return response.json();
      })
      .then((datosProgreso) => {
        console.log("¡LOGIN EXITOSO!");
        console.log("Datos de progreso recibidos:", datosProgreso);

        // 3. ¡LOGIN EXITOSO!
        // Guardamos las credenciales reales para usarlas en toda la app
        authHeadersGet = testAuthHeader;
        authHeadersPost = {
          Authorization: `Basic ${testCredentials}`,
          "Content-Type": "application/json",
        };

        // Ocultamos el login y mostramos el panel
        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
        console.log("Panel de admin mostrado.");

        // 4. Cargamos los datos
        console.log("Cargando datos principales de la app...");
        actualizarVistaProgreso(datosProgreso); // Ya tenemos estos datos

        // --- ¡CAMBIO IMPORTANTE! ---
        // En lugar de 'cargarProductosIniciales()', llamamos a la nueva función
        fetchProductsAdmin();
        // --- FIN DEL CAMBIO ---
      })
      .catch((error) => {
        // 5. LOGIN FALLIDO
        console.error("--- ERROR CATASTRÓFICO EN EL LOGIN ---");
        console.error("El objeto de error es:", error);
        if (error.message.includes("Failed to fetch")) {
          console.error("DETALLE DEL ERROR: 'Failed to fetch'. Error de CORS o red.");
          loginError.textContent = "Error de red o CORS. Revisa la consola (F12).";
        } else if (error.message.includes("Contraseña incorrecta")) {
          loginError.textContent = error.message;
        } else {
          loginError.textContent = `Error: ${error.message}`;
        }
      })
      .finally(() => {
        // 6. Reactivamos el botón
        console.log("--- Bloque 'finally' del login ejecutado. ---");
        loginButton.disabled = false;
        loginButton.textContent = "Entrar";
      });
  });

  // -----------------------------------------------------------------
  // --- TU CÓDIGO ANTERIOR COMIENZA AQUÍ ---
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

  // --- ¡ELIMINADO! ---
  // let allProducts = []; // Ya no se usa

  // --- ¡NUEVO! Estado de carga (como en catalago.js) ---
  let currentState = {
    page: 0, // Spring Boot usa paginación base 0
    size: 20, // Cargamos de 20 en 20
    searchTerm: null,
    isLoading: false,
    hasMore: true,
  };
  let searchTimer; // Timer para el "debounce" del buscador

  // --- Funciones (Diálogo y Progreso - SIN CAMBIOS) ---
  // (Estas funciones son de tu código original y no necesitan cambios)

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

  // NUEVA: Función para "dibujar" una tarjeta (APENDE, NO REEMPLAZA)
  // Usa el HTML exacto de tu 'renderProducts' original
  const drawProductCardAdmin = (producto) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.dataset.id = producto.id;
    card.dataset.nombre = producto.nombre;
    card.dataset.stock = producto.cantidad; // 'cantidad' es el stock total
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
    grid.appendChild(card); // La clave: appendChild
  };

  // NUEVA: Función principal para cargar productos (adaptada de catalago.js)
  const fetchProductsAdmin = async () => {
    if (currentState.isLoading || !currentState.hasMore) return;

    currentState.isLoading = true;
    console.log(`Admin: Cargando página ${currentState.page}, Búsqueda: ${currentState.searchTerm || "ninguna"}`);

    // Construye la URL
    let url = `${baseApiUrl}/api/productos?page=${currentState.page}&size=${currentState.size}`;
    if (currentState.searchTerm) {
      url += `&search=${encodeURIComponent(currentState.searchTerm)}`;
    }

    try {
      // ¡Usamos los headers de autenticación!
      const response = await fetch(url, {
        method: "GET",
        headers: authHeadersGet, // ¡IMPORTANTE!
      });

      if (response.status === 401) throw new Error("Error de autenticación (401).");
      if (!response.ok) throw new Error("No se pudieron cargar los productos.");

      const pageData = await response.json(); // La API devuelve un objeto Page
      console.log("Datos de página recibidos:", pageData);

      // Dibujamos los productos de esta página
      pageData.content.forEach((producto) => {
        drawProductCardAdmin(producto);
      });

      // Actualizamos el estado
      currentState.page++; // Incrementamos para la próxima carga
      currentState.hasMore = !pageData.last; // 'last' es true si es la última página

      if (!currentState.hasMore) {
        console.log("No hay más productos que cargar.");
      }

      // Mostrar mensaje si la primera página no trajo resultados
      if (currentState.page === 1 && pageData.content.length === 0) {
        if (currentState.searchTerm) {
          grid.innerHTML = `<p class="info-message">No se encontraron productos para "${currentState.searchTerm}".</p>`;
        } else {
          grid.innerHTML = '<p class="info-message">No hay productos para mostrar.</p>';
        }
      }
    } catch (error) {
      console.error("--- ERROR en 'fetchProductsAdmin' ---", error);
      grid.innerHTML = `<p class="error-message">${error.message}</p>`;
    } finally {
      currentState.isLoading = false;
    }
  };

  // --- Funciones del Modal (SIN CAMBIOS) ---
  // (Estas funciones son de tu código original y no necesitan cambios)

  const openSellModal = async (productoId, productoNombre, defaultPrice) => {
    console.log(`Abriendo modal para vender: ${productoNombre} (ID: ${productoId})`);
    modalProductName.textContent = productoNombre;
    modalProductIdInput.value = productoId;
    modalPriceInput.value = defaultPrice;
    modalQuantityInput.value = "1";
    storeSelectorContainer.innerHTML = '<p class="loading-stores">Cargando tiendas...</p>';
    modalOverlay.classList.remove("hidden");

    try {
      console.log(`Buscando inventarios para producto ID: ${productoId}`);
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
          console.warn("El producto tiene inventarios, pero ninguno con stock > 0.");
          storeSelectorContainer.innerHTML =
            '<p class="error-message">Este producto está agotado en todas las tiendas.</p>';
        }
      } else {
        console.warn("El producto no está registrado en ninguna tienda.");
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
        console.log("Respuesta de /api/ventas recibida. Estado:", response.status);
        if (response.status === 401) throw new Error("Error de autenticación.");
        if (!response.ok) {
          return response.text().then((text) => {
            console.error("Error en la respuesta del servidor (texto):", text);
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

        // --- ¡CAMBIO IMPORTANTE! ---
        // Llamamos a la función 'updateProductInUI' modificada
        updateProductInUI(ventaRecienRegistrada.producto.id, ventaRecienRegistrada.cantidadVendida);
        actualizarVistaProgreso(datosProgreso);
      })
      .catch((error) => {
        console.error("Error al registrar la venta:", error);
        alert(`Error: ${error.message}`);
      });
  };

  // --- ¡MODIFICADO! ---
  // Esta función ya no usa 'allProducts'. Actualiza el DOM directamente.
  const updateProductInUI = (productId, cantidadVendida) => {
    console.log(`Actualizando UI: Producto ${productId} vendió ${cantidadVendida} unidades.`);

    // Buscamos la tarjeta directamente en el DOM
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
      const newStock = parseInt(card.dataset.stock, 10) - cantidadVendida;
      card.dataset.stock = newStock; // Actualiza el data-attribute

      // Actualizamos el texto visible del stock
      const stockSpan = card.querySelector(".stock");
      if (stockSpan) {
        stockSpan.textContent = `Stock Total: ${newStock}`;
      }
    } else {
      console.warn(`No se encontró la tarjeta del producto ${productId} para actualizar.`);
    }
  };

  // --- Asignación de Eventos ---

  // --- ¡MODIFICADO! Evento del buscador con "Debounce" ---
  searchInput.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();

    // Limpiamos el timer anterior
    clearTimeout(searchTimer);

    // Creamos un nuevo timer
    searchTimer = setTimeout(() => {
      // Si la búsqueda cambió, reseteamos todo
      if (searchTerm !== (currentState.searchTerm || "")) {
        console.log("Búsqueda cambió. Reseteando grid...");
        currentState.searchTerm = searchTerm || null;
        currentState.page = 0; // Reinicia a la página 0
        currentState.hasMore = true;
        grid.innerHTML = ""; // Limpiamos el grid
        fetchProductsAdmin(); // Cargamos la primera página de resultados
      }
    }, 400); // Espera 400ms después de la última tecla
  });

  // Evento para abrir el modal de venta (Sin cambios)
  grid.addEventListener("click", (event) => {
    if (event.target.classList.contains("sell-btn")) {
      const card = event.target.closest(".product-card");
      openSellModal(card.dataset.id, card.dataset.nombre, card.dataset.precio);
    }
  });

  // Eventos para cerrar el modal (Sin cambios)
  closeBtn.addEventListener("click", closeSellModal);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeSellModal();
    }
  });

  // Evento para enviar el formulario de venta (Sin cambios)
  sellForm.addEventListener("submit", handleSellSubmit);

  // --- ¡NUEVO! Scroll Infinito (como en catalago.js) ---
  window.addEventListener("scroll", () => {
    // Si el usuario está cerca del final Y no estamos cargando Y hay más por cargar...
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
      !currentState.isLoading &&
      currentState.hasMore
    ) {
      console.log("Llegando al final, cargando más productos...");
      fetchProductsAdmin(); // Carga la siguiente página
    }
  });

  // --- Carga Inicial de Datos ---

  // --- ¡ELIMINADO! ---
  // La función 'cargarProductosIniciales' ya no existe.
  // La carga ahora se dispara desde el login.

  // Esta función ya no se usa, pero la dejamos por si acaso.
  // La llamada a progreso ya se hace en el login.
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

  // YA NO LLAMAMOS A NADA AQUÍ
  console.log("app.js: Asignación de eventos y funciones completada. Esperando login...");
});
