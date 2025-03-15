// car.js

// Variables globales
let threeRenderer = null;
let threeScene, threeCamera, threeAnimationFrame;
let threeCart; // Carrito principal (controlado por el usuario)
let keys = {}; // Para almacenar las teclas presionadas

// Arrays para cajas en la banda, trabajadores y datos de zonas
let beltBoxes = [];  
let miniPeople = []; 
let zonesData = [];  

let hasRedirected = false; // (opcional, para redirección)
let loadedFont = null;     // Fuente para los letreros

//////////////////////////////////////////////
// Parámetros Globales
//////////////////////////////////////////////

// Piso: 100×100 (de -50 a 50 en X y Z)
const floorSize = 100;

// Banda de producción
const beltStartX = -60;
const beltEndX = 60;
const beltWidth = 10; // Banda en Z: de -5 a 5
const beltSpeed = 0.1; // Producción más lenta
const spawnPoint = new THREE.Vector3(beltStartX, 2, 0);

// Región de "pintura" en la banda: cuando pasa por aquí, se marca como ready (sin cambiar apariencia)
const paintRegionMin = -10;
const paintRegionMax = 10;

// Zonas de almacenamiento: 10 zonas en la periferia  
const zoneSize = 15;      // Cada zona es un cuadrado de 15×15
const zoneHalf = zoneSize / 2;
// Definir 10 posiciones para las zonas en la periferia (distribuidas en los bordes)
const zonePositions = [
  new THREE.Vector2(-40, 45), new THREE.Vector2(0, 45), new THREE.Vector2(40, 45),    // Borde superior
  new THREE.Vector2(-40, -45), new THREE.Vector2(0, -45), new THREE.Vector2(40, -45), // Borde inferior
  new THREE.Vector2(-45, 20), new THREE.Vector2(-45, -20),                              // Borde izquierdo
  new THREE.Vector2(45, 20), new THREE.Vector2(45, -20)                                 // Borde derecho
];
// Asignar 10 colores para las zonas
const zoneColors = [
  0xff0000, // rojo
  0x00ff00, // verde
  0x0000ff, // azul
  0xffff00, // amarillo
  0xff00ff, // magenta
  0x00ffff, // cian
  0x8B4513, // marrón
  0xffa500, // naranja
  0x800080, // púrpura
  0x808080  // gris
];

//////////////////////////////////////////////
// Parámetros para Trabajadores
//////////////////////////////////////////////

const numWorkers = 10; // Número de mini personas
const separationThreshold = 3; // Distancia mínima para separarlos

//////////////////////////////////////////////
// INICIALIZACIÓN DE LA ESCENA
//////////////////////////////////////////////

function initThreeJS() {
  const container = document.getElementById("threejs-container");
  if (threeRenderer) return; // Evitar duplicación

  // Crear escena y cámara
  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  threeCamera.position.set(0, 40, 60);
  threeCamera.lookAt(0, 0, 0);

  // Crear renderizador y agregarlo al contenedor
  threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(threeRenderer.domElement);

  // Luces
  threeScene.add(new THREE.AmbientLight(0xaaaaaa));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 50, 50);
  threeScene.add(directionalLight);

  // Piso
  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  threeScene.add(floor);

  // Crear la banda de producción
  createBelt();

  // Crear las 10 zonas de almacenamiento en la periferia (con letreros)
  createZones();

  // Iniciar spawneo periódico de cajas en la banda (cada 4000 ms)
  setInterval(spawnBeltBox, 4000);

  // Crear mini personas (trabajadores) dispersos aleatoriamente por todo el piso
  createMiniPeople();

  // Crear el carrito principal (controlado por el usuario)
  createCart();

  // Configurar controles de teclado
  window.addEventListener("keydown", (e) => { keys[e.key] = true; });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  // Bucle de animación
  function animate() {
    if (!threeRenderer) return;
    threeAnimationFrame = requestAnimationFrame(animate);

    // Actualizar movimiento de las cajas en la banda
    updateBeltBoxes();

    // Actualizar movimiento del carrito
    updateCartMovement();

    // Actualizar trabajadores: recoger cajas y entregarlas a la zona correspondiente
    updateWorkers();

    threeRenderer.render(threeScene, threeCamera);
  }
  animate();

  // Ajustar tamaño al redimensionar la ventana
  window.addEventListener("resize", () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    threeRenderer.setSize(width, height);
    threeCamera.aspect = width / height;
    threeCamera.updateProjectionMatrix();
  });
}

//////////////////////////////////////////////
// CREACIÓN DE ELEMENTOS DE LA ESCENA
//////////////////////////////////////////////

// Banda de producción
function createBelt() {
  const beltGeo = new THREE.PlaneGeometry(beltEndX - beltStartX, beltWidth);
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.position.set((beltStartX + beltEndX) / 2, 0.1, 0);
  beltMesh.rotation.x = -Math.PI / 2;
  threeScene.add(beltMesh);
}

// Crear las 10 zonas de almacenamiento con letreros
function createZones() {
  zonesData = [];
  const loader = new THREE.FontLoader();
  loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", function(font) {
    for (let i = 0; i < zonePositions.length; i++) {
      // Zona: plano semitransparente
      const zoneGeo = new THREE.PlaneGeometry(zoneSize, zoneSize);
      const zoneMat = new THREE.MeshStandardMaterial({
        color: zoneColors[i],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      zoneMesh.rotation.x = -Math.PI / 2;
      zoneMesh.position.set(zonePositions[i].x, 0.1, zonePositions[i].y);
      threeScene.add(zoneMesh);
      
      // Letrero: texto 3D resaltado
      let text = "ZONE " + (i+1);
      const textGeo = new THREE.TextGeometry(text, {
        font: font,
        size: 3,
        height: 0.5,
      });
      textGeo.computeBoundingBox();
      const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
      const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(textGeo, textMat);
      textMesh.position.set(zonePositions[i].x - textWidth/2, 1, zonePositions[i].y);
      threeScene.add(textMesh);
      
      zonesData.push({
        color: zoneColors[i],
        center: zonePositions[i],
        halfSize: zoneHalf,
      });
    }
  });
}

// Spawnea una caja en la banda de producción
function spawnBeltBox() {
  const boxGeo = new THREE.BoxGeometry(4, 4, 4);
  // Asignar aleatoriamente uno de los 10 colores (este será el color original)
  const randIndex = Math.floor(Math.random() * zoneColors.length);
  const assignedColor = zoneColors[randIndex];
  const boxMat = new THREE.MeshStandardMaterial({ color: assignedColor });
  const box = new THREE.Mesh(boxGeo, boxMat);
  // Guardar el color original en userData
  box.userData.originalColor = assignedColor;
  // No cambiar visualmente el color; se marca internamente como ready
  box.userData.ready = false;
  // Posicionar la caja en el spawnPoint, con z aleatorio dentro del ancho de la banda
  const randomZ = Math.random() * beltWidth - beltWidth/2;
  box.position.set(beltStartX, 2, randomZ);
  // Marcarla como no recogida
  box.userData.collected = false;
  // No asignada a ningún trabajador aún
  box.userData.assigned = false;
  threeScene.add(box);
  beltBoxes.push(box);
}

// Actualiza el movimiento de las cajas en la banda
function updateBeltBoxes() {
  for (let i = beltBoxes.length - 1; i >= 0; i--) {
    const box = beltBoxes[i];
    box.position.x += beltSpeed;
    
    // Si la caja está en la región de pintura, marcarla como ready (sin cambiar su color)
    if (box.position.x >= paintRegionMin && box.position.x <= paintRegionMax) {
      box.userData.ready = true;
    }
    
    // Si la caja sale del extremo derecho, eliminarla
    if (box.position.x > beltEndX) {
      threeScene.remove(box);
      box.geometry.dispose();
      box.material.dispose();
      beltBoxes.splice(i, 1);
      console.log("Caja catalogada");
    }
  }
}

// Actualiza el movimiento del carrito principal (controlado por el usuario)
function updateCartMovement() {
  const moveSpeed = 0.5;
  let delta = new THREE.Vector3(0, 0, 0);
  if (keys["ArrowRight"]) delta.x += moveSpeed;
  if (keys["ArrowLeft"])  delta.x -= moveSpeed;
  if (keys["ArrowUp"])    delta.z -= moveSpeed;
  if (keys["ArrowDown"])  delta.z += moveSpeed;
  threeCart.position.add(delta);
}

// Crea el carrito principal (controlado por el usuario)
function createCart() {
  threeCart = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(3, 1, 5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const cartBody = new THREE.Mesh(bodyGeo, bodyMat);
  cartBody.position.set(0, 0.5, 0);
  threeCart.add(cartBody);
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cartCabin = new THREE.Mesh(cabinGeo, cabinMat);
  cartCabin.position.set(0, 1.2, 0.5);
  threeCart.add(cartCabin);
  // Posicionar el carrito en una zona accesible (por ejemplo, en el borde inferior del mapa)
  threeCart.position.set(0, 0, -45);
  threeScene.add(threeCart);
}

// Crea mini personas (trabajadores) dispersas aleatoriamente por todo el piso
function createMiniPeople() {
  miniPeople = [];
  for (let i = 0; i < numWorkers; i++) {
    const person = createMiniPerson();
    // Distribuir aleatoriamente en todo el piso (dejando un margen de 20 unidades)
    person.position.set(
      Math.random() * (floorSize - 40) - (floorSize - 40) / 2,
      0,
      Math.random() * (floorSize - 40) - (floorSize - 40) / 2
    );
    person.userData.targetBox = null;
    person.userData.stage = null; // "pickup" o "delivery"
    person.userData.deliveryDestination = null;
    threeScene.add(person);
    miniPeople.push(person);
  }
}

// Crea un mini trabajador (persona) usando primitivas
function createMiniPerson() {
  const person = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffcc99 }));
  head.position.set(0, 1.8, 0);
  person.add(head);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2, 16), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
  body.position.set(0, 0.9, 0);
  person.add(body);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  leftArm.position.set(-0.6, 1.5, 0);
  person.add(leftArm);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  rightArm.position.set(0.6, 1.5, 0);
  person.add(rightArm);
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 16), new THREE.MeshStandardMaterial({ color: 0x000000 }));
  leftLeg.position.set(-0.3, 0.5, 0);
  person.add(leftLeg);
  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 16), new THREE.MeshStandardMaterial({ color: 0x000000 }));
  rightLeg.position.set(0.3, 0.5, 0);
  person.add(rightLeg);
  return person;
}

// Actualiza el comportamiento de los trabajadores para recoger y entregar cajas
function updateWorkers() {
  miniPeople.forEach((worker) => {
    // Si el trabajador ya tiene una caja asignada pero esa caja ya no está en beltBoxes, limpiar asignación
    if (worker.userData.targetBox && !beltBoxes.includes(worker.userData.targetBox)) {
      worker.userData.targetBox = null;
      worker.userData.stage = null;
      worker.userData.deliveryDestination = null;
    }
    // Si no tiene asignada una caja, buscar una caja "ready" y sin recoger y no asignada
    if (!worker.userData.targetBox) {
      let availableBox = beltBoxes.find(box =>
        box.userData.ready && !box.userData.collected && !box.userData.assigned
      );
      if (availableBox) {
        worker.userData.targetBox = availableBox;
        worker.userData.stage = "pickup";
        availableBox.userData.assigned = true;
      }
    }
    if (worker.userData.targetBox) {
      const targetBox = worker.userData.targetBox;
      if (worker.userData.stage === "pickup") {
        // Mover al trabajador hacia la caja
        let direction = new THREE.Vector3().subVectors(targetBox.position, worker.position);
        if (direction.length() > 0.5) {
          direction.normalize().multiplyScalar(0.2);
          worker.position.add(direction);
        } else {
          // Caja recogida: marcarla como recogida
          targetBox.userData.collected = true;
          // Buscar la zona cuyo color coincida con el color original de la caja
          let destZone = zonesData.find(zone => zone.color === targetBox.userData.originalColor);
          if (destZone) {
            worker.userData.deliveryDestination = new THREE.Vector3(destZone.center.x, targetBox.position.y, destZone.center.y);
            worker.userData.stage = "delivery";
          }
        }
      } else if (worker.userData.stage === "delivery") {
        let dest = worker.userData.deliveryDestination;
        let direction = new THREE.Vector3().subVectors(dest, worker.position);
        if (direction.length() > 0.5) {
          direction.normalize().multiplyScalar(0.2);
          worker.position.add(direction);
          // Hacer que la caja siga al trabajador con un pequeño offset (suavemente)
          targetBox.position.lerp(worker.position.clone().add(new THREE.Vector3(1, 0, 0)), 0.1);
        } else {
          // Entrega completada: remover la caja
          threeScene.remove(targetBox);
          targetBox.geometry.dispose();
          targetBox.material.dispose();
          const idx = beltBoxes.indexOf(targetBox);
          if (idx > -1) beltBoxes.splice(idx, 1);
          // Liberar la asignación en el trabajador
          worker.userData.targetBox = null;
          worker.userData.stage = null;
          worker.userData.deliveryDestination = null;
          console.log("Caja entregada");
        }
      }
    }
  });
}

// Actualiza el movimiento del carrito principal (controlado por el usuario)
function updateCartMovement() {
  const moveSpeed = 0.5;
  let delta = new THREE.Vector3(0, 0, 0);
  if (keys["ArrowRight"]) delta.x += moveSpeed;
  if (keys["ArrowLeft"])  delta.x -= moveSpeed;
  if (keys["ArrowUp"])    delta.z -= moveSpeed;
  if (keys["ArrowDown"])  delta.z += moveSpeed;
  threeCart.position.add(delta);
}

// Crea el carrito principal (controlado por el usuario)
function createCart() {
  threeCart = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(3, 1, 5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const cartBody = new THREE.Mesh(bodyGeo, bodyMat);
  cartBody.position.set(0, 0.5, 0);
  threeCart.add(cartBody);
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cartCabin = new THREE.Mesh(cabinGeo, cabinMat);
  cartCabin.position.set(0, 1.2, 0.5);
  threeCart.add(cartCabin);
  // Posicionar el carrito en una zona accesible (por ejemplo, en el borde inferior del mapa)
  threeCart.position.set(0, 0, -45);
  threeScene.add(threeCart);
}

////////////////////////////////////////////
// (Opcional) Función para eliminar Three.js y liberar recursos
////////////////////////////////////////////

function removeThreeJS() {
  if (threeRenderer) {
    cancelAnimationFrame(threeAnimationFrame);
    const container = document.getElementById("threejs-container");
    if (threeRenderer.domElement && threeRenderer.domElement.parentNode) {
      threeRenderer.domElement.parentNode.removeChild(threeRenderer.domElement);
    }
    if (threeScene) {
      while (threeScene.children.length > 0) {
        let child = threeScene.children[0];
        threeScene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
    threeRenderer.dispose();
    threeRenderer = null;
  }
}

////////////////////////////////////////////
// INICIALIZACIÓN DE LA ESCENA
////////////////////////////////////////////

window.onload = function () {
  initThreeJS();
};
