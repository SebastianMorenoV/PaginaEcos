document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a los elementos del DOM ---
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    
    const modalOverlay = document.getElementById('sell-modal-overlay');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductIdInput = document.getElementById('modal-product-id');
    const modalQuantityInput = document.getElementById('modal-quantity');
    const modalPriceInput = document.getElementById('modal-price'); // <-- NUEVA REFERENCIA
    const sellForm = document.getElementById('sell-form');
    const closeBtn = document.querySelector('.close-btn');

    // --- Configuración del API ---
    const baseApiUrl = 'http://localhost:8080'; 

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
            card.dataset.precio = producto.precio; // <-- GUARDAMOS EL PRECIO

            card.innerHTML = `
                <img src="data:image/jpeg;base64,${producto.foto}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <div class="product-info">
                    <span class="price">$${producto.precio.toFixed(2)} MXN</span>
                    <span class="stock">Stock: ${producto.cantidad}</span>
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

    // MODIFICADA para aceptar el precio por defecto
    const openSellModal = (productoId, productoNombre, maxStock, defaultPrice) => {
        modalProductName.textContent = productoNombre;
        modalProductIdInput.value = productoId;
        modalQuantityInput.value = '1';
        modalQuantityInput.max = maxStock;
        modalPriceInput.value = defaultPrice; // <-- RELLENAMOS EL PRECIO
        modalOverlay.classList.remove('hidden');
    };

    const closeSellModal = () => {
        modalOverlay.classList.add('hidden');
    };

    // MODIFICADA para enviar el nuevo precio
    const handleSellSubmit = (event) => {
        event.preventDefault();

        const productoId = modalProductIdInput.value;
        const cantidad = parseInt(modalQuantityInput.value, 10);
        const precioVendido = parseFloat(modalPriceInput.value); // <-- OBTENEMOS EL PRECIO

        if (cantidad <= 0 || precioVendido < 0) {
            alert('La cantidad y el precio deben ser valores positivos.');
            return;
        }

        // AÑADIMOS el precioVendido al objeto que se envía
        const datosVenta = {
            productoId: parseInt(productoId, 10),
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
            alert(`¡Venta registrada con éxito para el producto: ${ventaConfirmada.producto.nombre}!`);
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

    // MODIFICADO para pasar el precio al abrir el modal
    grid.addEventListener('click', (event) => {
        if (event.target.classList.contains('sell-btn')) {
            const card = event.target.closest('.product-card');
            const productoId = card.dataset.id;
            const productoNombre = card.dataset.nombre;
            const maxStock = card.dataset.stock;
            const defaultPrice = card.dataset.precio; // <-- OBTENEMOS EL PRECIO
            openSellModal(productoId, productoNombre, maxStock, defaultPrice);
        }
    });

    closeBtn.addEventListener('click', closeSellModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeSellModal();
        }
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
            grid.innerHTML = `<p class="error-message">No se pudieron cargar los productos. Asegúrate de que el backend en <strong>${baseApiUrl}</strong> esté funcionando.</p>`;
        });
});