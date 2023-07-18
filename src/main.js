import * as THREE from 'three';
import { OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GUI } from 'dat.gui';


// variables
let lamp_case, bulb, glass, foil, chair;
let loading;
let colorButton;
let pressed = false;
let mouseX_delta = 0;
let mouseY_delta = 0;
const navBrand = document.querySelector(".navbar-brand");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// scene
const scene = new THREE.Scene();

// renderer
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, });
renderer.useLegacyLights = false;
renderer.shadowMap.enabled = true;

// camera
const camera = new THREE.PerspectiveCamera(45, 
  sizes.width/sizes.height, 0.1, 1000);
camera.position.z = 10;
camera.position.y = 20;
camera.position.x = -20;
scene.add(camera);

// GUI
const gui = new GUI();
gui.close();


// orbit controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
controls.enablePan = false; 
controls.enableZoom = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 10;

controls.minDistance = 5;
controls.maxDistance = 35;
controls.minPolarAngle = Math.PI / 10; 
controls.maxPolarAngle = Math.PI / 2; 
controls.minAzimuthAngle = Math.PI + 0.05; 
controls.maxAzimuthAngle = Math.PI * 2 - 0.05; 

// render on demand
controls.addEventListener('change', () => {
  render()
});

// point light
const light = new THREE.PointLight("#ffffff");
light.position.set(-3, 0, -0.5);
light.intensity = 20;
light.distance = 4.3;
light.decay = 1;
scene.add(light)

// ambient light
const light2 = new THREE.AmbientLight("#ffffff");
light2.position.set(-3, 0, -0.5);
light2.intensity = 0.5;
scene.add(light2)

// spot light
const spotLight = new THREE.SpotLight(0xffffff, 5000);
spotLight.angle = 0.5; // Set spotlight angle to 0.5 radians
spotLight.penumbra = 0.1; // Set spotlight penumbra
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 512*2; // default
spotLight.shadow.mapSize.height = 512*2; // default
const helper = new THREE.SpotLightHelper(spotLight);


// gltf loader
const loader = new GLTFLoader(setLoadManager());


// glass material
const glass_material = new THREE.MeshPhongMaterial({
  color:'#FFFFFF',
  opacity: 0.7,
  transparent: true,
  side: THREE.DoubleSide,
});

// foil material
const foil_material = new THREE.MeshStandardMaterial({
  color: '#848789',
  roughness: 0.2,
  metalness: 1,
  side: THREE.DoubleSide,
});

// load lamp
loader.load('./objects/lamp.gltf',
  (gltf) => {
    const root = gltf.scene;
    scene.add(root);
    
    //console.log(dumpObject(root).join('\n'));
    
    lamp_case = root.getObjectByName('case001');
    
    glass = root.getObjectByName('glass001');
    glass.material = glass_material;
    
    foil = root.getObjectByName('inner_foil001');
    foil.material = foil_material;

    bulb = root.getObjectByName('bulb001');
    bulb.material.emissive.set('#FFFF00');
    bulb.material.emissiveIntensity = 1;

    const newPosition = new THREE.Vector3(-3, 5, -3);
    spotLight.target.position.copy(newPosition);

    lamp_case.add(spotLight);
    lamp_case.add(spotLight.target);
 });

// load color panel
loader.load('./objects/color_panel.gltf',
  (gltf) => { 
    colorButton = gltf.scene;
    colorButton.position.set(0,-2,10)
    colorButton.name = 'colorButton'
    scene.add(colorButton);
    //console.log(dumpObject(colorButton).join('\n'));
  },
);

// load room
loader.load('./objects/room/test.gltf',
  (gltf) => {
    const room = gltf.scene;
    room.scale.set(5,5,5);
    room.position.y = -12.5;
    room.position.x = -24.75;
    room.children[0].children[0].receiveShadow = true;
    room.children[0].children[1].receiveShadow = true;
    scene.add(room);
    //console.log(dumpObject(room).join('\n'));

  }
);

// load chair
loader.load('./objects/chair/chair.glb',
  (gltf) => {
    chair = gltf.scene;
    chair.scale.set(20,20,20)
    chair.position.set(-9,-12,-30)
    chair.children[0].castShadow = true;
    chair.children[0].children[0].castShadow = true;
    chair.children[0].children[5].castShadow = true;
    chair.children[0].children[6].castShadow = true;
    chair.children[0].children[7].castShadow = true;
    scene.add(chair);
    addToGui("chair");
    //console.log(dumpObject(chair).join('\n'));
  }
);

// color picker
const colorPicker = document.getElementById("colorpicker");
colorPicker.addEventListener("input", (event) => {
  const color = event.target.value;
  navBrand.style.color = color;
  bulb.material.emissive.set(color)
  spotLight.color.set(color);
  render();
});



// raycaster
const raycaster = new THREE.Raycaster();

function onMouseDown(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(mouse, camera);

  // Find all intersecting objects
  const intersects = raycaster.intersectObjects(scene.children, true);

  if(intersects.length > 0) { 
    //console.log(intersects[0].object) 
    if (intersects[0].object.parent.name === 'case001') {
      pressed = true;
      controls.enabled = false;
    } else if(intersects[0].object.parent.name === 'control_panel') {
      console.log("show picker")
      //colorPicker.click();      
      colorPicker.showPicker();
    }
  }
}

function onMouseup(event) {
  if(!fullScreen) {
    openFullscreen()
    fullScreen = true
  }
  if(pressed){
    pressed = false;
    controls.enabled  = true;
    mouseX_delta = 0;
    mouseY_delta = 0;
  }
  render();
}
let fullScreen = false
function onMouseMove(event) {
  if(pressed) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1 ;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    mouseX_delta -= mouseX;
    mouseY_delta -= mouseY;
    
    lamp_case.rotation.x = Math.max(Math.min(lamp_case.rotation.x + mouseY_delta * 5, Math.PI), -Math.PI);
    lamp_case.rotation.y = Math.max(Math.min(lamp_case.rotation.y + mouseX_delta * 5, Math.PI), -Math.PI);

    mouseX_delta = mouseX;
    mouseY_delta = mouseY;
    render();
  }
}

// mouse events
renderer.domElement.addEventListener('pointerdown', onMouseDown, false);
renderer.domElement.addEventListener('pointerup', onMouseup, false);
renderer.domElement.addEventListener('pointermove', onMouseMove);


// RENDER
const tempV = new THREE.Vector3();
function render(time) {
  time *= 0.001;
  
  if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
  }

  // colorpicker position set
  if(colorButton) {
    colorButton.updateWorldMatrix(true, false);
    colorButton.getWorldPosition(tempV);
    tempV.project(camera);
    const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
    // move the elem to that position
    colorPicker.style.translate = `${x-30}px ${y-40}px`;
  }
  renderer.render(scene, camera);  
  
  //requestAnimationFrame(render);
}
  
//requestAnimationFrame(render);
render();

window.addEventListener('resize', () => {
  render();
});


// resize window
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}


// dat.gui
function addToGui(obj) {
  if(obj==='chair') {
    const folderPos = gui.addFolder("position");
    folderPos.add(chair.position, 'x', -35, -9).onChange(() => {render()});
    folderPos.add(chair.position, 'z', -32, 16).onChange(() => {render()});
    folderPos.open();
    const folderRot = gui.addFolder("rotation");
    folderRot.add(chair.rotation, 'y', -Math.PI * 2, Math.PI * 2).onChange(() => {render()});
    folderRot.open();
  }
}


// fullscreen
function openFullscreen() {
  const elem = document.body
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}


// show loaded objects tree in console
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
  const localPrefix = isLast ? '└─' : '├─';
  lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
  const newPrefix = prefix + (isLast ? '  ' : '│ ');
  const lastNdx = obj.children.length - 1;
  obj.children.forEach((child, ndx) => {
    const isLast = ndx === lastNdx;
    dumpObject(child, lines, isLast, newPrefix);
  });
  return lines;
}

// load manager
function setLoadManager() {
  const manager = new THREE.LoadingManager();

  manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
    //console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    loading = true;
  };

  manager.onLoad = function ( ) {
    //console.log( 'Loading complete!');
    const loadingScreen = document.getElementById( 'loadScreen' );	
    loadingScreen.remove();
    loading = false;
    render();
  };

  manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
  };

  manager.onError = function ( url ) {
    console.log( 'There was an error loading ' + url );
  };
  
  return manager;
}