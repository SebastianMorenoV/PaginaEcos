document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const apiUrl = 'http://localhost:8080/api/productos';

    let allProducts = []; // Guardaremos una copia de todos los productos aquí

    // Función para mostrar los productos en la cuadrícula
    const renderProducts = (productsToRender) => {
        grid.innerHTML = ''; // Limpiamos la cuadrícula antes de mostrar los resultados
        productsToRender.forEach(producto => {
            // Creamos el elemento de la tarjeta
            const card = document.createElement('div');
            card.classList.add('product-card');

            // Definimos el contenido HTML de la tarjeta
            card.innerHTML = `
                <img src="data:image/jpeg;base64,${producto.foto}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <div class="product-info">
                    <span class="price">$${producto.precio.toFixed(2)} MXN</span>
                    <span class="stock">Stock: ${producto.cantidad}</span>
                </div>
            `;
            // Añadimos la tarjeta a la cuadrícula
            grid.appendChild(card);
        });
    };

    // Función de búsqueda
    const filterProducts = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredProducts = allProducts.filter(producto => 
            producto.nombre.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    };

    // Evento para el campo de búsqueda (se activa cada vez que escribes)
    searchInput.addEventListener('input', filterProducts);

    // Hacemos la llamada inicial para obtener todos los productos
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('La respuesta de la red no fue exitosa');
            return response.json();
        })
        .then(productos => {
            allProducts = productos; // Guardamos los productos en nuestra variable
            renderProducts(allProducts); // Mostramos todos los productos inicialmente
        })
        .catch(error => {
            console.error('Hubo un problema al cargar los productos:', error);
            grid.innerHTML = '<p class="error-message">No se pudieron cargar los productos. Asegúrate de que el backend esté funcionando.</p>';
        });
});