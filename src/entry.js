/**
 * entry.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import * as THREE from 'three';

import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import pugModel from './assets/models/pug/pug.fbx';

const clock = new THREE.Clock();
let mixers = [];
//import SeedScene from './objects/Scene.js';

let pug, cameraPug, controls;
let lights = {}

let moving = false, currAnimation;

const playerControl = (forward, turn) => {
  if (forward==0 && turn==0){
    delete pug.userData.move;
  }else{
    if (pug.userData.move){
      pug.userData.move.forward = forward;
      pug.userData.move.turn = turn;
    }else{
      pug.userData.move = { forward, turn, time: clock.getElapsedTime(), speed: 8 };         
    }
  }
}
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    const keyCode = event.keyCode;
    let forward = (pug.userData.move!==undefined) ? pug.userData.move.forward : 0;
    let turn = (pug.userData.move!==undefined) ?  pug.userData.move.turn : 0;


    switch(keyCode){
      case 87://W
        forward = 1;
        moving = true;
        break;
      case 83://S
        forward = -1;
        moving = true;
        break;
      case 65://A
        turn = 1; 
        break;
      case 68://D
        turn = -1;            
        break;
    }
     
    playerControl(forward,turn);
    updateAnimation();
};

document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) {

    
  let forward = ( pug.userData && pug.userData.move!==undefined) ? pug.userData.move.forward : 0;
  let turn = (pug.userData && pug.userData.move!==undefined) ?  pug.userData.move.turn : 0;
  
  switch(event.keyCode){
    case 87://W
    case 83://S
      forward = 0;
      moving = false;
      break;
    case 65://A
    case 68://D
      turn = 0;
      
      break;
  }
  
  
  playerControl(forward, turn);
  updateAnimation();
}

const updateAnimation = () => {    
  let newAnimation = 'idle';  
  if (moving) {
    newAnimation = 'walk';  
    if (pug.userData.move){
      if (pug.userData.move.speed > 10) newAnimation = 'run';
      if (pug.userData.move.speed > 15) newAnimation = 'sprint';
    }    
  }
  
  if (currAnimation !== newAnimation){
    currAnimation = newAnimation;
    mixers[0].stopAllAction();
    const action = actions[newAnimation];  
    action.reset();
    if (pug.userData.move && pug.userData.move.forward < 0){
      action.timeScale = -1;      
      if(action.time === 0) {
        action.time = action.getClip().duration;
      }
    }else{
      action.time = 0;
      action.timeScale = 1;
    }

    console.log(action);
    
    
    action.fadeIn(0.5);
    action.play();
  }
  
}
const setupLights = () => {


  lights.hemisphere = new THREE.HemisphereLight(0xffffff,0x7ec0ee, 0.5);
  scene.add(lights.hemisphere);

  lights.directional = new THREE.DirectionalLight(0xffffff,0.4);
  //directionalLight.castShadow = true;

  scene.add(lights.directional);

  lights.directional2= new THREE.PointLight(0xff0000,0.4);
  lights.directional2.castShadow = true;
  lights.directional2.position.x = 3;
  lights.directional2.position.z = -10;
  lights.directional2.position.y = 10;

  scene.add(lights.directional2);

  lights.directional3 = new THREE.DirectionalLight(0x0000ff,0.4);
  lights.directional3.castShadow = true;
  lights.directional3.position.x = -3
  lights.directional3.position.z = -10
  scene.add(lights.directional3);


  lights.directional4 = new THREE.DirectionalLight(0xffffff,0.7);
  lights.directional4.castShadow = true;
  lights.directional4.position.z = 10
  scene.add(lights.directional4);
}

const clearColor = 0x7ec0ee;
const scene = new THREE.Scene();
cameraPug =  new THREE.PerspectiveCamera(20);
const renderer = new THREE.WebGLRenderer({antialias: true});

for (let i = 0; i < 4; i++){
  const size = 3;
  const geometry = new THREE.SphereBufferGeometry(size,3,3);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  //mesh.receiveShadow = true;
  mesh.position.x = 10*i;
  mesh.position.y = 2;
  scene.add(mesh);
}


const geometry2 = new THREE.PlaneBufferGeometry(2000,2000);
const material2 = new THREE.MeshStandardMaterial({color: 0xe3e7ea});
const plane = new THREE.Mesh(geometry2, material2);
plane.receiveShadow = true;
plane.rotation.x = - Math.PI/2;
plane.position.y = 0;
scene.add(plane);

setupLights();
scene.fog = new THREE.Fog(clearColor,60,100);

const loader = new FBXLoader();
let actions = {}

const animationIndex = [
  {
    name: 'walk',
    start: 60,
    end: 110
  },
  {
    name: 'idle',
    start: 0,
    end: 25
  },
  {
    name: 'run',
    start: 180,
    end: 200
  },
  {
    name: 'sprint',
    start: 250,
    end:  270
  },
  {
    name: 'jump',
    start: 300,
    end:  340
  },
  {
    name: 'crouch',
    start: 550,
    end:  600
  },
  {
    name: 'barking',
    start: 800,
    end:  840
  },
  {
    name: 'dig',
    start: 1195,
    end:  1220
  },
  {
    name: 'sit',
    start: 1350,
    end:  1500
  },
  {
    name: 'scratch',
    start: 1505,
    end:  1587
  },
  {
    name: 'down',
    start: 1700,
    end:  1930
  },
  {
    name: 'pee',
    start: 2620,
    end:  2750
  }
]
loader.load(pugModel, object => {
  object.traverse(child => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.shininess = 0.1;
      child.castShadow = true;
    }
  })

  
  const totalClip = object.animations[8];
  const mixer = new THREE.AnimationMixer(object);

  for (let i = 0; i < animationIndex.length; i++){    
    const currAnimation = animationIndex[i];
    const clip = THREE.AnimationUtils.subclip(totalClip, currAnimation.name, currAnimation.start,currAnimation.end,30);
    const action = mixer.clipAction(clip);   
    actions[currAnimation.name] = action;
  }
  
  currAnimation = 'idle';
  actions[currAnimation].play();
  mixers.push(mixer);
  object.scale.multiplyScalar(0.2);
  object.rotateY(Math.PI/2);
  pug = new THREE.Object3D();  
  
  pug.add(object);  
    

  cameraPug.position.set(-50,5,0);    
  
  pug.add(cameraPug);
  
  controls = new OrbitControls( cameraPug, renderer.domElement );  
  controls.minPolarAngle = 0;
  controls.maxPolarAngle =  Math.PI * 0.45;
  
  
  scene.add(pug);
  
  onAnimationFrameHandler();
})

// renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(clearColor, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;




// render loop
const onAnimationFrameHandler = () => {  
  var dt = clock.getDelta();
  
  for (let i = 0; i < mixers.length; i++){    
    mixers[i].update(dt);
  }

  
  if (pug) {    
    if(pug.userData.move !== undefined){
      if (pug.userData.move.forward > 0 && pug.userData.move.speed < 20) pug.userData.move.speed += 0.1;    
      pug.translateX(pug.userData.move.forward * dt * pug.userData.move.speed);
      pug.rotateY(pug.userData.move.turn * dt);
    }
    let targetPosition = pug.position.clone();
    targetPosition.y += 5;
    controls.target.copy(targetPosition);
    controls.update();

  }


  

  renderer.render(scene, cameraPug);
  //seedScene.update && seedScene.update(timeStamp);
  window.requestAnimationFrame(onAnimationFrameHandler);
}
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHandler = () => {
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  cameraPug.aspect = innerWidth / innerHeight;
  cameraPug.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler);

// dom
document.body.style.margin = 0;
document.body.appendChild( renderer.domElement );
