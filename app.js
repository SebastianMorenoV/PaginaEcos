document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a los elementos del DOM ---
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    
    const modalOverlay = document.getElementById('sell-modal-overlay');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductIdInput = document.getElementById('modal-product-id');
    const modalQuantityInput = document.getElementById('modal-quantity');
    const modalPriceInput = document.getElementById('modal-price');
    const storeSelectorContainer = document.getElementById('store-selector-container'); // <-- NUEVO
    const sellForm = document.getElementById('sell-form');
    const closeBtn = document.querySelector('.close-btn');

    // --- Configuración del API ---
    const baseApiUrl = 'https://api.ecosapp.shop'; // Cambia esto según tu configuración

    let allProducts = [];

    // --- Funciones ---
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

    // MODIFICADA: Ahora abre el modal y LUEGO carga las tiendas
    const openSellModal = async (productoId, productoNombre, defaultPrice) => {
        modalProductName.textContent = productoNombre;
        modalProductIdInput.value = productoId;
        modalPriceInput.value = defaultPrice;
        modalQuantityInput.value = '1';
        storeSelectorContainer.innerHTML = '<p class="loading-stores">Cargando tiendas...</p>';
        modalOverlay.classList.remove('hidden');

        // Hacemos la llamada al nuevo endpoint para obtener los inventarios
        try {
            const response = await fetch(`${baseApiUrl}/api/inventarios/producto/${productoId}`);
            if (!response.ok) throw new Error('No se pudieron cargar los inventarios.');
            
            const inventarios = await response.json();
            
            // Construimos el selector de tiendas
            if (inventarios.length > 0) {
                let selectHTML = '<select id="modal-store-select" required>';
                inventarios.forEach(inv => {
                    // Solo mostramos tiendas con stock
                    if (inv.cantidad > 0) {
                        selectHTML += `<option value="${inv.tienda.id}" data-max-stock="${inv.cantidad}">
                            ${inv.tienda.nombre} (Stock: ${inv.cantidad})
                        </option>`;
                    }
                });
                selectHTML += '</select>';
                storeSelectorContainer.innerHTML = selectHTML;

                // Ajustamos el máx. de cantidad según la tienda seleccionada
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
    
    // Nueva función para actualizar el input de cantidad
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
            tiendaId: parseInt(tiendaId, 10), // <-- AÑADIDO
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
        .then(ventaConfirmada => {
            alert(`¡Venta registrada con éxito desde la tienda!`);
            closeSellModal();
            updateProductInUI(productoId, cantidad);
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
        renderProducts(allProducts);
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
});