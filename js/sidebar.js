// Cargar la barra lateral y superior desde menu.html
fetch('menu.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('menu-container').innerHTML = html;
    asignarEventosSidebar(); // Asigna los eventos después de cargar
    deshabilitarBotones();   // Deshabilita los botones específicos
  });

function asignarEventosSidebar() {
  document.querySelector(".sidebar img[title='Currículum']").onclick = () => window.location.href = 'index.html';
  document.querySelector(".sidebar img[title='Proyectos']").onclick = () => window.location.href = 'projects.html';
  document.querySelector(".sidebar img[title='Portafolio']").onclick = () => window.location.href = 'portfolio.html';
  document.querySelector(".sidebar img[title='Configuración']").onclick = () => window.location.href = 'settings.html';
}

function deshabilitarBotones() {
  // Seleccionar los botones a deshabilitar
  let botonesDeshabilitados = [
    document.querySelector(".sidebar img[title='Proyectos']"),
    document.querySelector(".sidebar img[title='Portafolio']"),
    document.querySelector(".sidebar img[title='Configuración']"),
    document.querySelector(".sidebar img[title='example2']"),
  ];
  
  // Aplicar la clase de deshabilitación
  botonesDeshabilitados.forEach(boton => {
    if (boton) {
      boton.classList.add("disabled-icon"); // Agrega la clase CSS
      boton.onclick = (e) => e.preventDefault(); // Evita que se active el clic
    }
  });
}
