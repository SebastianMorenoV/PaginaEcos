document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------------
  // --- NUEVA LÓGICA DE LOGIN ---
  // -----------------------------------------------------------------

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
    const password = loginPasswordInput.value;
    if (!password) {
      loginError.textContent = "Por favor, ingresa una contraseña.";
      return;
    }

    // Deshabilitamos el botón para evitar doble clic
    loginButton.disabled = true;
    loginButton.textContent = "Verificando...";
    loginError.textContent = ""; // Limpiamos errores

    // 1. Creamos credenciales temporales SOLO para la prueba
    const testCredentials = btoa(`${ADMIN_USERNAME}:${password}`);
    const testAuthHeader = {
      Authorization: `Basic ${testCredentials}`,
    };

    // 2. Hacemos una llamada de prueba a un endpoint protegido
    fetch(`${baseApiUrl}/api/ventas/progreso`, {
      method: "GET",
      headers: testAuthHeader,
    })
      .then((response) => {
        if (response.status === 401) {
          throw new Error("Contraseña incorrecta.");
        }
        if (!response.ok) {
          throw new Error("Error al conectar con el servidor.");
        }
        return response.json();
      })
      .then((datosProgreso) => {
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

        // 4. Cargamos los datos
        actualizarVistaProgreso(datosProgreso); // Ya tenemos estos datos
        cargarProductosIniciales(); // Llamamos a la otra función de carga
      })
      .catch((error) => {
        // 5. LOGIN FALLIDO
        loginError.textContent = error.message;
      })
      .finally(() => {
        // 6. Reactivamos el botón
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
  const storeSelectorContainer = document.getElementById(
    "store-selector-container"
  );
  const sellForm = document.getElementById("sell-form");
  const closeBtn = document.querySelector(".close-btn");
  const progressBarInner = document.getElementById("progress-bar-inner");
  const progressBarText = document.getElementById("progress-bar-text");
  const infoUltimoCiclo = document.getElementById("info-ultimo-ciclo");
  const dialog = document.getElementById("my-dialog");
  const closeButton = document.getElementById("close-dialog-btn");
  const progressBarClickableArea = document.getElementById(
    "progress-bar-clickable-area"
  );
  const salesTableBody = document.getElementById("sales-table-body");

  let allProducts = [];

  // --- Funciones ---

  const renderUltimasVentas = (ventas) => {
    salesTableBody.innerHTML = "";
    if (!ventas || ventas.length === 0) {
      salesTableBody.innerHTML =
        '<tr><td colspan="3">No se encontraron ventas recientes.</td></tr>';
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

    fetch(`${baseApiUrl}/api/ventas/ultimas`, {
      method: "GET",
      headers: authHeadersGet,
    })
      .then((response) => {
        if (response.status === 401)
          throw new Error("Error de autenticación. Revisa tus credenciales.");
        if (!response.ok) throw new Error("No se pudieron cargar las ventas.");
        return response.json();
      })
      .then((data) => {
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
    if (!datosProgreso) return;
    const progreso = datosProgreso.progresoActual || 0;
    const porcentaje = (progreso / 1000) * 100;
    progressBarInner.style.width = `${porcentaje}%`;
    progressBarText.textContent = `$${progreso.toFixed(2)} / $1000`;
    if (datosProgreso.ventaQueCompletoCiclo) {
      const venta = datosProgreso.ventaQueCompletoCiclo;
      const fechaVenta = new Date(venta.fechaVenta);
      const opcionesFecha = { year: "numeric", month: "long", day: "numeric" };
      const fechaFormateada = fechaVenta.toLocaleDateString(
        "es-MX",
        opcionesFecha
      );
      infoUltimoCiclo.textContent = `El último reparto se completó el ${fechaFormateada} con la venta #${
        venta.id
      } (Monto: $${venta.precioTotal.toFixed(2)}).`;
    } else {
      infoUltimoCiclo.textContent = `Aún no se ha completado el primer reparto. ¡Vamos por ello! 🚀`;
    }
  };

  const renderProducts = (productsToRender) => {
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
  };

  const filterProducts = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = allProducts.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm)
    );
    renderProducts(filteredProducts);
  };

  const openSellModal = async (productoId, productoNombre, defaultPrice) => {
    modalProductName.textContent = productoNombre;
    modalProductIdInput.value = productoId;
    modalPriceInput.value = defaultPrice;
    modalQuantityInput.value = "1";
    storeSelectorContainer.innerHTML =
      '<p class="loading-stores">Cargando tiendas...</p>';
    modalOverlay.classList.remove("hidden");

    try {
      const response = await fetch(
        `${baseApiUrl}/api/inventarios/producto/${productoId}`,
        {
          method: "GET",
          headers: authHeadersGet,
        }
      );
      if (response.status === 401) throw new Error("Error de autenticación.");
      if (!response.ok) throw new Error("No se pudieron cargar los inventarios.");

      const inventarios = await response.json();

      if (inventarios.length > 0) {
        let selectHTML = '<select id="modal-store-select" required>';
        inventarios.forEach((inv) => {
          if (inv.cantidad > 0) {
            selectHTML += `<option value="${inv.tienda.id}" data-max-stock="${inv.cantidad}">
                            ${inv.tienda.nombre} (Stock: ${inv.cantidad})
                        </option>`;
          }
        });
        selectHTML += "</select>";
        storeSelectorContainer.innerHTML = selectHTML;

        const storeSelect = document.getElementById("modal-store-select");
        updateMaxQuantity();
        storeSelect.addEventListener("change", updateMaxQuantity);
      } else {
        storeSelectorContainer.innerHTML =
          '<p class="error-message">Este producto no está en ninguna tienda.</p>';
      }
    } catch (error) {
      console.error(error);
      storeSelectorContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
  };

  const updateMaxQuantity = () => {
    const storeSelect = document.getElementById("modal-store-select");
    if (storeSelect) {
      const selectedOption = storeSelect.options[storeSelect.selectedIndex];
      modalQuantityInput.max = selectedOption.dataset.maxStock;
    }
  };

  const closeSellModal = () => {
    modalOverlay.classList.add("hidden");
  };

  const handleSellSubmit = (event) => {
    event.preventDefault();

    const productoId = modalProductIdInput.value;
    const storeSelect = document.getElementById("modal-store-select");

    if (!storeSelect) {
      alert("Por favor, selecciona una tienda válida.");
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

    fetch(`${baseApiUrl}/api/ventas`, {
      method: "POST",
      headers: authHeadersPost,
      body: JSON.stringify(datosVenta),
    })
      .then((response) => {
        if (response.status === 401) throw new Error("Error de autenticación.");
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(text);
          });
        }
        return response.json();
      })
      .then((datosProgreso) => {
        alert(`¡Venta registrada con éxito!`);
        closeSellModal();
        const ventaRecienRegistrada = datosProgreso.ventaRecienRegistrada;
        updateProductInUI(
          ventaRecienRegistrada.producto.id,
          ventaRecienRegistrada.cantidadVendida
        );
        actualizarVistaProgreso(datosProgreso);
      })
      .catch((error) => {
        console.error("Error al registrar la venta:", error);
        alert(`Error: ${error.message}`);
      });
  };

  const updateProductInUI = (productId, cantidadVendida) => {
    const productIndex = allProducts.findIndex((p) => p.id == productId);
    if (productIndex > -1) {
      allProducts[productIndex].cantidad -= cantidadVendida;
    }
    filterProducts();
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

  // <-- MOVIMOS ESTAS LLAMADAS DENTRO DEL LOGIN -->
  
  // Convertimos la carga de productos en una función
  const cargarProductosIniciales = () => {
    fetch(`${baseApiUrl}/api/productos`, {
      method: "GET",
      headers: authHeadersGet,
    })
      .then((response) => {
        if (response.status === 401)
          throw new Error("Error de autenticación. Revisa tus credenciales.");
        if (!response.ok) throw new Error("No se pudieron cargar los productos.");
        return response.json();
      })
      .then((productos) => {
        allProducts = productos;
        renderProducts(allProducts);
      })
      .catch((error) => {
        console.error("Hubo un problema al cargar los productos:", error);
        grid.innerHTML = `<p class="error-message">${error.message}</p>`;
      });
  };

  // Convertimos la carga de progreso en una función
  const cargarProgresoInicial = async () => {
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
  // cargarProgresoInicial(); // <-- Esta línea se fue
});