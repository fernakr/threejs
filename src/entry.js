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

let pug;
let lights = {}

var xSpeed = 0.5;
var ySpeed = 0.5;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
        pug.position.z += ySpeed;
    } else if (keyCode == 83) {
      pug.position.z -= ySpeed;
    } else if (keyCode == 65) {
      pug.position.x += xSpeed;
    } else if (keyCode == 68) {
      pug.position.x -= xSpeed;
    } else if (keyCode == 32) {
      pug.position.set(0, 0, 0);
    }
};


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
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});

// for (let i = 0; i < 4; i++){
//   const size = 3;
//   const geometry = new THREE.SphereBufferGeometry(size,3,3);
//   const material = new THREE.MeshStandardMaterial();
//   const mesh = new THREE.Mesh(geometry, material);
//   mesh.castShadow = true;
//   //mesh.receiveShadow = true;
//   mesh.position.x = 10*i;
//   scene.add(mesh);
// }


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

loader.load(pugModel, object => {
  object.traverse(child => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.shininess = 0.1;
      child.castShadow = true;
    }
  })

  const mixer = new THREE.AnimationMixer(object);
  const totalClip = object.animations[8];
  const walkClip = THREE.AnimationUtils.subclip(totalClip, 'walk', 60,110,30);
  const walkAction = mixer.clipAction(walkClip);
  walkAction.play();
  mixers.push(mixer);

  object.scale.multiplyScalar(0.1);
  pug = new THREE.Object3D();
  pug.add(object);

  scene.add(pug);
  onAnimationFrameHandler();
})

// camera
camera.position.set(6,10,-30);
camera.lookAt(new THREE.Vector3(0,0,0));

// renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(clearColor, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls( camera, renderer.domElement );
		controls.minPolarAngle = 0;
		controls.maxPolarAngle =  Math.PI * 0.45;



// render loop
const onAnimationFrameHandler = (timeStamp) => {
  //console.log(timeStamp);
  var dt = clock.getDelta();
  for (let i = 0; i < mixers.length; i++){
    mixers[i].update(dt);
  }
  renderer.render(scene, camera);
  //seedScene.update && seedScene.update(timeStamp);
  window.requestAnimationFrame(onAnimationFrameHandler);
}
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHandler = () => {
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler);

// dom
document.body.style.margin = 0;
document.body.appendChild( renderer.domElement );
