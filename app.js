document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a los elementos del DOM ---
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    
    const modalOverlay = document.getElementById('sell-modal-overlay');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductIdInput = document.getElementById('modal-product-id');
    const modalQuantityInput = document.getElementById('modal-quantity');
    const modalPriceInput = document.getElementById('modal-price');
    const storeSelectorContainer = document.getElementById('store-selector-container');
    const sellForm = document.getElementById('sell-form');
    const closeBtn = document.querySelector('.close-btn');

    // Referencias a los nuevos elementos del panel de progreso
    const progressBarInner = document.getElementById('progress-bar-inner');
    const progressBarText = document.getElementById('progress-bar-text');
    const infoUltimoCiclo = document.getElementById('info-ultimo-ciclo');
    
    // Dialogo
    const dialog = document.getElementById('my-dialog');
    const closeButton = document.getElementById('close-dialog-btn');
    const progressBarClickableArea = document.getElementById('progress-bar-clickable-area'); // (Esta es la nueva línea)
    
    // <-- NUEVO 1: Añadimos la referencia al cuerpo de la tabla del diálogo -->
    const salesTableBody = document.getElementById('sales-table-body');

    // --- Configuración del API ---
    const baseApiUrl = 'https://api.ecosapp.shop'; // Cambia esto según tu configuración

    let allProducts = [];

    // --- Funciones ---

    // <-- NUEVO 2: Creamos una función para "dibujar" las ventas en la tabla -->
    const renderUltimasVentas = (ventas) => {
        // Limpiamos la tabla (quitamos el "Cargando...")
        salesTableBody.innerHTML = '';

        // Verificamos si la API devolvió ventas
        if (!ventas || ventas.length === 0) {
            salesTableBody.innerHTML = '<tr><td colspan="3">No se encontraron ventas recientes.</td></tr>';
            return;
        }

        // Recorremos el arreglo de ventas y creamos una fila <tr> por cada una
        ventas.forEach(venta => {
            // Asumimos que tu DTO devuelve: nombreProducto, montoTotal, fechaVenta
            
            // Formateamos los datos
            const producto = venta.nombreProducto || 'Producto no disponible';
            const monto = `$${Number(venta.montoTotal).toFixed(2)}`;
            const fecha = new Date(venta.fechaVenta).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            // Creamos el HTML de la fila
            const filaHTML = `
                <tr>
                    <td>${producto}</td>
                    <td>${monto}</td>
                    <td>${fecha}</td>
                </tr>
            `;

            // La añadimos al <tbody> de la tabla
            salesTableBody.innerHTML += filaHTML;
        });
    };

    // <-- NUEVO 3: Modificamos el listener del clic para que llame a la API -->
    //Funciones de mi dialogo
    progressBarClickableArea.addEventListener('click', () => {
        // 1. Mostramos el modal inmediatamente
        dialog.showModal();
        
        // 2. Ponemos la tabla en estado de "Cargando..."
        //    (Tu HTML ya tiene este estado por defecto, pero lo re-aseguramos)
        salesTableBody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';

        // 3. Hacemos la llamada a tu nuevo endpoint
        fetch(`${baseApiUrl}/api/ventas/ultimas`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se pudieron cargar las ventas.');
                }
                return response.json();
            })
            .then(data => {
                // 4. Cuando los datos llegan, llamamos a la función para dibujarlos
                renderUltimasVentas(data);
            })
            .catch(error => {
                // 5. Si algo sale mal, mostramos un error en la tabla
                console.error('Error al cargar últimas ventas:', error);
                salesTableBody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
            });
    });

    closeButton.addEventListener('click' , ()=>{
        dialog.close();
    });


    // Función dedicada para actualizar la vista del progreso
    const actualizarVistaProgreso = (datosProgreso) => {
        if (!datosProgreso) return;

        const progreso = datosProgreso.progresoActual || 0;
        const porcentaje = (progreso / 1000) * 100;

        // Actualizar barra (solo el ancho)
        progressBarInner.style.width = `${porcentaje}%`;
        
        // Actualizamos el texto en el nuevo elemento span
        progressBarText.textContent = `$${progreso.toFixed(2)} / $1000`;

        // Actualizar texto informativo CON FECHA
        if (datosProgreso.ventaQueCompletoCiclo) {
            const venta = datosProgreso.ventaQueCompletoCiclo;
            
            // Formateamos la fecha para que sea legible
            const fechaVenta = new Date(venta.fechaVenta);
            const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
            const fechaFormateada = fechaVenta.toLocaleDateString('es-MX', opcionesFecha);

            infoUltimoCiclo.textContent = `El último reparto se completó el ${fechaFormateada} con la venta #${venta.id} (Monto: $${venta.precioTotal.toFixed(2)}).`;
        } else {
            infoUltimoCiclo.textContent = `Aún no se ha completado el primer reparto. ¡Vamos por ello! 🚀`;
        }
    };

    const renderProducts = (productsToRender) => {
        grid.innerHTML = '';
        productsToRender.forEach(producto => {
            const card = document.createElement('div');
            card.classList.add('product-card');
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
        const filteredProducts = allProducts.filter(p => p.nombre.toLowerCase().includes(searchTerm));
        renderProducts(filteredProducts);
    };

    const openSellModal = async (productoId, productoNombre, defaultPrice) => {
        modalProductName.textContent = productoNombre;
        modalProductIdInput.value = productoId;
        modalPriceInput.value = defaultPrice;
        modalQuantityInput.value = '1';
        storeSelectorContainer.innerHTML = '<p class="loading-stores">Cargando tiendas...</p>';
        modalOverlay.classList.remove('hidden');

        try {
            const response = await fetch(`${baseApiUrl}/api/inventarios/producto/${productoId}`);
            if (!response.ok) throw new Error('No se pudieron cargar los inventarios.');
            
            const inventarios = await response.json();
            
            if (inventarios.length > 0) {
                let selectHTML = '<select id="modal-store-select" required>';
                inventarios.forEach(inv => {
                    if (inv.cantidad > 0) {
                        selectHTML += `<option value="${inv.tienda.id}" data-max-stock="${inv.cantidad}">
                            ${inv.tienda.nombre} (Stock: ${inv.cantidad})
                        </option>`;
                    }
                });
                selectHTML += '</select>';
                storeSelectorContainer.innerHTML = selectHTML;

                const storeSelect = document.getElementById('modal-store-select');
                updateMaxQuantity();
                storeSelect.addEventListener('change', updateMaxQuantity);
            } else {
                storeSelectorContainer.innerHTML = '<p class="error-message">Este producto no está en ninguna tienda.</p>';
            }
        } catch (error) {
            console.error(error);
            storeSelectorContainer.innerHTML = '<p class="error-message">Error al cargar tiendas.</p>';
        }
    };
    
    const updateMaxQuantity = () => {
        const storeSelect = document.getElementById('modal-store-select');
        if (storeSelect) {
            const selectedOption = storeSelect.options[storeSelect.selectedIndex];
            modalQuantityInput.max = selectedOption.dataset.maxStock;
        }
    };

    const closeSellModal = () => {
        modalOverlay.classList.add('hidden');
    };

    const handleSellSubmit = (event) => {
        event.preventDefault();

        const productoId = modalProductIdInput.value;
        const storeSelect = document.getElementById('modal-store-select');
        
        if (!storeSelect) {
            alert("Por favor, selecciona una tienda válida.");
            return;
        }
        
        const tiendaId = storeSelect.value;
        const cantidad = parseInt(modalQuantityInput.value, 10);
        const precioVendido = parseFloat(modalPriceInput.value);

        if (cantidad <= 0 || precioVendido < 0) {
            alert('La cantidad y el precio deben ser valores positivos.');
            return;
        }

        const datosVenta = {
            productoId: parseInt(productoId, 10),
            tiendaId: parseInt(tiendaId, 10),
            cantidad: cantidad,
            precioVendido: precioVendido 
        };

        fetch(`${baseApiUrl}/api/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta),
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(datosProgreso => {
            alert(`¡Venta registrada con éxito!`);
            closeSellModal();
            const ventaRecienRegistrada = datosProgreso.ventaRecienRegistrada;
            updateProductInUI(ventaRecienRegistrada.producto.id, ventaRecienRegistrada.cantidadVendida);
            actualizarVistaProgreso(datosProgreso);
        })
        .catch(error => {
            console.error('Error al registrar la venta:', error);
            alert(`Error: ${error.message}`);
        });
    };
    
    const updateProductInUI = (productId, cantidadVendida) => {
        const productIndex = allProducts.findIndex(p => p.id == productId);
        if (productIndex > -1) {
            allProducts[productIndex].cantidad -= cantidadVendida;
        }
        filterProducts();
    };

    // --- Asignación de Eventos ---
    searchInput.addEventListener('input', filterProducts);

    grid.addEventListener('click', (event) => {
        if (event.target.classList.contains('sell-btn')) {
            const card = event.target.closest('.product-card');
            openSellModal(card.dataset.id, card.dataset.nombre, card.dataset.precio);
        }
    });

    closeBtn.addEventListener('click', closeSellModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { closeSellModal(); }
    });
    sellForm.addEventListener('submit', handleSellSubmit);

    // --- Carga Inicial de Datos ---
    
    fetch(`${baseApiUrl}/api/productos`)
        .then(response => response.json())
        .then(productos => {
            allProducts = productos;
            renderProducts(allProducts);
        })
        .catch(error => {
            console.error('Hubo un problema al cargar los productos:', error);
            grid.innerHTML = `<p class="error-message">No se pudieron cargar los productos.</p>`;
        });

    const cargarProgresoInicial = async () => {
        try {
            const response = await fetch(`${baseApiUrl}/api/ventas/progreso`);
            if (!response.ok) throw new Error('Error al obtener el progreso.');
            const datosProgreso = await response.json();
            actualizarVistaProgreso(datosProgreso);
        } catch (error) {
            console.error('Error al cargar el progreso inicial:', error);
            infoUltimoCiclo.textContent = 'No se pudo cargar el estado del progreso.';
        }
    };

    cargarProgresoInicial();
});