// main.js

// =============================
// MANEJO DE VENTANAS Y MENÚ
// =============================
function loadWindow(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById('windows-container').innerHTML = data;
            document.getElementById(id).style.display = 'block';
            updateMenuSelection(id);
            // Elimina el vehículo (car.js) al abrir una ventana
            removeThreeJS(); // función definida en car.js
        })
        .catch(error => console.error('Error al cargar la ventana:', error));
}

function openWindow(id) {
    const fileMap = {
        'cv': 'cv.html',
        'projects': 'projects.html',
        'portfolio': 'portfolio.html',
        'settings': 'settings.html',
        'example2': 'example2.html'
    };
    if (fileMap[id]) {
        loadWindow(id, fileMap[id]);
    }
}

function closeWindow(id) {
    document.getElementById(id).style.display = 'none';
    removeMenuSelection();
    // Si no quedan ventanas abiertas, reinicia el vehículo
    setTimeout(() => {
        const openWindows = document.querySelectorAll('.window[style*="display: block"]').length;
        if (openWindows === 0) {
            initThreeJS(); // función definida en car.js
        }
    }, 300);
}

function updateMenuSelection(id) {
    document.querySelectorAll('.sidebar img').forEach(img => img.classList.remove('selected'));
    const images = {
        'cv': 'images/ubuntu.png',
        'projects': 'images/files-and-folder.png',
        'portfolio': 'images/maletin.png',
        'settings': 'images/engranaje.png'
        
    };
    document.querySelectorAll('.sidebar img').forEach(img => {
        if (img.src.includes(images[id])) {
            img.classList.add('selected');
        }
    });
}

function removeMenuSelection() {
    document.querySelectorAll('.sidebar img').forEach(img => img.classList.remove('selected'));
}

// =============================
// ACTUALIZACIÓN DE FECHA Y HORA
// =============================
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    };
    document.getElementById('datetime').textContent = now.toLocaleDateString('es-ES', options);
}
setInterval(updateDateTime, 1000);
updateDateTime();





// =============================
// MENÚ CONTEXTUAL (CLIC DERECHO)
// =============================
document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    const contextMenu = document.getElementById("context-menu");
    contextMenu.style.top = event.clientY + "px";
    contextMenu.style.left = event.clientX + "px";
    contextMenu.style.display = "block";
});
document.addEventListener("click", function () {
    document.getElementById("context-menu").style.display = "none";
});

// =============================
// INICIALIZACIÓN
// =============================
window.onload = function () {
    openWindow('cv');
    // Al cargar la página, inicializa el vehículo si no hay ventana abierta
    initThreeJS(); // definida en car.js
    // Si se desea abrir una ventana por defecto, se puede llamar a openWindow('cv');
};
