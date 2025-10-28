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
        console.log("Estado de la respuesta (response.status):", response.status);
        console.log("Respuesta 'ok' (response.ok):", response.ok);

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
        cargarProductosIniciales(); // Llamamos a la otra función de carga
      })
      .catch((error) => {
        // 5. LOGIN FALLIDO
        console.error("--- ERROR CATASTRÓFICO EN EL LOGIN ---");
        console.error("El objeto de error es:", error);

        // Este es el mensaje de error más importante
        if (error.message.includes("Failed to fetch")) {
          console.error(
            "DETALLE DEL ERROR: 'Failed to fetch'. Esto casi siempre es un error de CORS o un problema de red (Firewall/Security Group)."
          );
          console.error(
            "REVISA: ¿Tu backend (Spring Boot) permite la cabecera 'Authorization' desde el dominio de tu frontend?"
          );
          loginError.textContent = "Error de red o CORS. Revisa la consola (F12).";
        } else if (error.message.includes("Contraseña incorrecta")) {
          console.error("DETALLE DEL ERROR: La autenticación falló (401).");
          loginError.textContent = error.message;
        } else {
          console.error("DETALLE DEL ERROR: Ocurrió un error inesperado.", error.message);
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
  // (Ahora está "dormido" hasta que el login sea exitoso)
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

  let allProducts = [];

  // --- Funciones ---

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

  //Funciones de mi dialogo
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

  // Función dedicada para actualizar la vista del progreso
  const actualizarVistaProgreso = (datosProgreso) => {
    if (!datosProgreso) {
      console.warn("actualizarVistaProgreso fue llamada sin datos.");
      return;
    }
    console.log("Actualizando vista de progreso...");

    // Verificamos 'progresoActual'
    const progreso = datosProgreso.progresoActual || 0;
    const porcentaje = (progreso / 1000) * 100;
    progressBarInner.style.width = `${porcentaje}%`;
    progressBarText.textContent = `$${progreso.toFixed(2)} / $1000`; // Esto ya era seguro

    if (datosProgreso.ventaQueCompletoCiclo) {
      const venta = datosProgreso.ventaQueCompletoCiclo;
      const fechaVenta = new Date(venta.fechaVenta);
      const opcionesFecha = { year: "numeric", month: "long", day: "numeric" };
      const fechaFormateada = fechaVenta.toLocaleDateString("es-MX", opcionesFecha);

      // --- ¡LA CORRECCIÓN DEFINITIVA! ---
      // Usamos 'venta.precioTotal' que viene de la entidad 'Venta.java'
      const monto = venta.precioTotal || 0;

      infoUltimoCiclo.textContent = `El último reparto se completó el ${fechaFormateada} con la venta #${
        venta.id
      } (Monto: $${monto.toFixed(2)}).`;
      // --- FIN DE LA CORRECCIÓN ---
    } else {
      infoUltimoCiclo.textContent = `Aún no se ha completado el primer reparto. ¡Vamos por ello! 🚀`;
    }
  };

  const renderProducts = (productsToRender) => {
    console.log(`Renderizando ${productsToRender.length} productos...`);
    grid.innerHTML = "";
    productsToRender.forEach((producto) => {
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
      grid.appendChild(card);
    });
    console.log("Renderizado de productos completo.");
  };

  const filterProducts = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = allProducts.filter((p) => p.nombre.toLowerCase().includes(searchTerm));
    renderProducts(filteredProducts);
  };

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
        updateProductInUI(ventaRecienRegistrada.producto.id, ventaRecienRegistrada.cantidadVendida);
        actualizarVistaProgreso(datosProgreso);
      })
      .catch((error) => {
        console.error("Error al registrar la venta:", error);
        alert(`Error: ${error.message}`);
      });
  };

  const updateProductInUI = (productId, cantidadVendida) => {
    console.log(`Actualizando UI: Producto ${productId} vendió ${cantidadVendida} unidades.`);
    const productIndex = allProducts.findIndex((p) => p.id == productId);
    if (productIndex > -1) {
      allProducts[productIndex].cantidad -= cantidadVendida;
    }
    filterProducts(); // Re-renderiza la lista de productos
  };

  // --- Asignación de Eventos ---
  searchInput.addEventListener("input", filterProducts);
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

  // --- Carga Inicial de Datos ---

  // Convertimos la carga de productos en una función
  const cargarProductosIniciales = () => {
    console.log("Iniciando 'cargarProductosIniciales'...");
    fetch(`${baseApiUrl}/api/productos`, {
      method: "GET",
      headers: authHeadersGet,
    })
      .then((response) => {
        console.log("Respuesta de /api/productos recibida. Estado:", response.status);
        if (response.status === 401) throw new Error("Error de autenticación (401) al cargar productos.");
        if (!response.ok) throw new Error("No se pudieron cargar los productos.");
        return response.json();
      })
      .then((productos) => {
        console.log(`Productos cargados exitosamente: ${productos.length} encontrados.`);
        allProducts = productos;
        renderProducts(allProducts);
      })
      .catch((error) => {
        console.error("--- ERROR en 'cargarProductosIniciales' ---");
        console.error(error);
        grid.innerHTML = `<p class="error-message">${error.message}</p>`;
      });
  };

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
