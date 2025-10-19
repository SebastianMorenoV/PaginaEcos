document.addEventListener("DOMContentLoaded", () => {
  // 1. Encuentra el botón del menú y el contenedor de los links.
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  // 2. Asegúrate de que ambos elementos existan en la página.
  //    Esto evita errores si cargas este script en una página sin menú.
  if (menuToggle && navLinks) {
    
    // 3. Escucha los clics que se hagan en el botón del menú.
    menuToggle.addEventListener("click", () => {
      
      // 4. Al hacer clic, alterna la clase 'active' en ambos elementos.
      //    El CSS se encargará de mostrar u ocultar el menú basado en esta clase.
      navLinks.classList.toggle("active");
      menuToggle.classList.toggle("active");

      // 5. (Opcional) Cambia el ícono del botón entre hamburguesa y 'X'.
      if (menuToggle.classList.contains("active")) {
        menuToggle.innerHTML = "&times;"; // Código HTML para una 'X' de cierre
      } else {
        menuToggle.innerHTML = "&#9776;"; // Código HTML para el ícono de hamburguesa
      }
    });
  }
});
