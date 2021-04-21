/**
 * entry.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import * as THREE from 'three';
import CANNON from 'cannon';

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import pugModel from './assets/models/pug/pug.fbx';
import treatModel from './assets/models/treat/treat.fbx';

const groundMat = new CANNON.Material();
const pugMat = new CANNON.Material();
const objectMat = new CANNON.Material();

const contactMaterial = new CANNON.ContactMaterial(groundMat, objectMat, {
    friction: 0.3,
    restitution: 0.1
});



const contactMaterial2 = new CANNON.ContactMaterial(objectMat, objectMat, {
  friction: 1,
  restitution: 0.1
});

const contactMaterial3 = new CANNON.ContactMaterial(groundMat, pugMat, {
  friction: 0.2,
  restitution: 0,
  contactEquationStiffness: 1e12,
  contactEquationRelaxation: 3,
  frictionEquationStiffness: 1e8,
  frictionEquationRegularizationTime: 0.1,
  contactEquationRegularizationTime: 0.2,

});


const contactMaterial4 = new CANNON.ContactMaterial(objectMat, pugMat, {
  friction: 10,
  restitution: 0.2
});




THREE.CannonDebugRenderer = function(scene, world, options){
  options = options || {};

  this.scene = scene;
  this.world = world;

  this._meshes = [];

  this._material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  this._sphereGeometry = new THREE.SphereGeometry(1);
  this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  this._planeGeometry = new THREE.PlaneGeometry( 10, 10, 10, 10 );
  this._cylinderGeometry = new THREE.CylinderGeometry( 1, 1, 10, 10 );
};

THREE.CannonDebugRenderer.prototype = {

  tmpVec0: new CANNON.Vec3(),
  tmpVec1: new CANNON.Vec3(),
  tmpVec2: new CANNON.Vec3(),
  tmpQuat0: new CANNON.Vec3(),

  update: function(){

      var bodies = this.world.bodies;
      var meshes = this._meshes;
      var shapeWorldPosition = this.tmpVec0;
      var shapeWorldQuaternion = this.tmpQuat0;

      var meshIndex = 0;

      for (var i = 0; i !== bodies.length; i++) {
          var body = bodies[i];

          for (var j = 0; j !== body.shapes.length; j++) {
              var shape = body.shapes[j];

              this._updateMesh(meshIndex, body, shape);

              var mesh = meshes[meshIndex];

              if(mesh){

                  // Get world position
                  body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
                  body.position.vadd(shapeWorldPosition, shapeWorldPosition);

                  // Get world quaternion
                  body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

                  // Copy to meshes
                  mesh.position.copy(shapeWorldPosition);
                  mesh.quaternion.copy(shapeWorldQuaternion);
              }

              meshIndex++;
          }
      }

      for(var i = meshIndex; i < meshes.length; i++){
          var mesh = meshes[i];
          if(mesh){
              this.scene.remove(mesh);
          }
      }

      meshes.length = meshIndex;
  },

  _updateMesh: function(index, body, shape){
      var mesh = this._meshes[index];
      if(!this._typeMatch(mesh, shape)){
          if(mesh){
              this.scene.remove(mesh);
          }
          mesh = this._meshes[index] = this._createMesh(shape);
      }
      this._scaleMesh(mesh, shape);
  },

  _typeMatch: function(mesh, shape){
      if(!mesh){
          return false;
      }
      var geo = mesh.geometry;
      return (
          (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
          (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
          (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
          (geo.id === shape.geometryId && shape instanceof CANNON.ConvexPolyhedron) ||
          (geo.id === shape.geometryId && shape instanceof CANNON.Trimesh) ||
          (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
      );
  },

  _createMesh: function(shape){
      var mesh;
      var material = this._material;

      switch(shape.type){

      case CANNON.Shape.types.SPHERE:
          mesh = new THREE.Mesh(this._sphereGeometry, material);
          break;

      case CANNON.Shape.types.BOX:
          mesh = new THREE.Mesh(this._boxGeometry, material);
          break;

      case CANNON.Shape.types.PLANE:
          mesh = new THREE.Mesh(this._planeGeometry, material);
          break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
          // Create mesh
          var geo = new THREE.Geometry();

          // Add vertices
          for (var i = 0; i < shape.vertices.length; i++) {
              var v = shape.vertices[i];
              geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
          }

          for(var i=0; i < shape.faces.length; i++){
              var face = shape.faces[i];

              // add triangles
              var a = face[0];
              for (var j = 1; j < face.length - 1; j++) {
                  var b = face[j];
                  var c = face[j + 1];
                  geo.faces.push(new THREE.Face3(a, b, c));
              }
          }
          geo.computeBoundingSphere();
          geo.computeFaceNormals();

          mesh = new THREE.Mesh(geo, material);
          shape.geometryId = geo.id;
          break;

      case CANNON.Shape.types.TRIMESH:
          var geometry = new THREE.Geometry();
          var v0 = this.tmpVec0;
          var v1 = this.tmpVec1;
          var v2 = this.tmpVec2;
          for (var i = 0; i < shape.indices.length / 3; i++) {
              shape.getTriangleVertices(i, v0, v1, v2);
              geometry.vertices.push(
                  new THREE.Vector3(v0.x, v0.y, v0.z),
                  new THREE.Vector3(v1.x, v1.y, v1.z),
                  new THREE.Vector3(v2.x, v2.y, v2.z)
              );
              var j = geometry.vertices.length - 3;
              geometry.faces.push(new THREE.Face3(j, j+1, j+2));
          }
          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new THREE.Mesh(geometry, material);
          shape.geometryId = geometry.id;
          break;

      case CANNON.Shape.types.HEIGHTFIELD:
          var geometry = new THREE.Geometry();

          var v0 = this.tmpVec0;
          var v1 = this.tmpVec1;
          var v2 = this.tmpVec2;
          for (var xi = 0; xi < shape.data.length - 1; xi++) {
              for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
                  for (var k = 0; k < 2; k++) {
                      shape.getConvexTrianglePillar(xi, yi, k===0);
                      v0.copy(shape.pillarConvex.vertices[0]);
                      v1.copy(shape.pillarConvex.vertices[1]);
                      v2.copy(shape.pillarConvex.vertices[2]);
                      v0.vadd(shape.pillarOffset, v0);
                      v1.vadd(shape.pillarOffset, v1);
                      v2.vadd(shape.pillarOffset, v2);
                      geometry.vertices.push(
                          new THREE.Vector3(v0.x, v0.y, v0.z),
                          new THREE.Vector3(v1.x, v1.y, v1.z),
                          new THREE.Vector3(v2.x, v2.y, v2.z)
                      );
                      var i = geometry.vertices.length - 3;
                      geometry.faces.push(new THREE.Face3(i, i+1, i+2));
                  }
              }
          }
          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new THREE.Mesh(geometry, material);
          shape.geometryId = geometry.id;
          break;
      }

      if(mesh){
          this.scene.add(mesh);
      }

      return mesh;
  },

  _scaleMesh: function(mesh, shape){
      switch(shape.type){

      case CANNON.Shape.types.SPHERE:
          var radius = shape.radius;
          mesh.scale.set(radius, radius, radius);
          break;

      case CANNON.Shape.types.BOX:
          mesh.scale.copy(shape.halfExtents);
          mesh.scale.multiplyScalar(2);
          break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
          mesh.scale.set(1,1,1);
          break;

      case CANNON.Shape.types.TRIMESH:
          mesh.scale.copy(shape.scale);
          break;

      case CANNON.Shape.types.HEIGHTFIELD:
          mesh.scale.set(1,1,1);
          break;

      }
  }
};

// init global vars
let mixers = [];
let pug, controls, pugBody;
let lights = {}
let treats = [];
let moving = false, currAnimation;
let actions = {}

// init THREE + CANNON stuff
const clock = new THREE.Clock();
const loader = new FBXLoader();
const scene = new THREE.Scene();
const cameraPug =  new THREE.PerspectiveCamera(20);
const renderer = new THREE.WebGLRenderer({antialias: true});
const world = new CANNON.World()

var cannonDebugRenderer = new THREE.CannonDebugRenderer( scene, world );


// init customizable vars
const clearColor = 0x7ec0ee;
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

const setupInit = () => {
 
  // renderer
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(clearColor, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  world.gravity.set(0, -9.82, 0)
  world.addContactMaterial(contactMaterial);
  world.addContactMaterial(contactMaterial2);
  world.addContactMaterial(contactMaterial3);
  world.addContactMaterial(contactMaterial4);

}
const playerControl = (forward, turn) => {
  if (forward==0 && turn==0){
    delete pug.userData.move;
  }else{
    if (pug.userData.move){
      pug.userData.move.forward = forward;
      pug.userData.move.turn = turn;
    }else{
      pug.userData.move = { forward, turn, time: clock.getElapsedTime(), speed: 23 };         
    }
  }
}


const onDocumentKeyDown = (event) => {
    const keyCode = event.keyCode;
    let forward = (pug.userData.move!==undefined) ? pug.userData.move.forward : 0;
    let turn = (pug.userData.move!==undefined) ?  pug.userData.move.turn : 0;

    console.log(keyCode);
    switch(keyCode){      
      case 87:
      case 38://W
        forward = 1;
        moving = true;
        break;
      case 83:
      case 40://S
        forward = -1;
        moving = true;
        break;
      case 65:
      case 37://A
        turn = 1; 
        break;
      case 68:
      case 39://D
        turn = -1;            
        break;
    }
     
    playerControl(forward,turn);
    updateAnimation();
};


const onDocumentKeyUp = (event) => {

    
  let forward = ( pug.userData && pug.userData.move!==undefined) ? pug.userData.move.forward : 0;
  let turn = (pug.userData && pug.userData.move!==undefined) ?  pug.userData.move.turn : 0;
  
  switch(event.keyCode){
    case 87:
    case 38://W
    case 83:
    case 40://S
      forward = 0;
      moving = false;
      break;
    case 65:
    case 37://A
    case 68:
    case 39://D
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
      if (pug.userData.move.speed > 30) newAnimation = 'run';
      if (pug.userData.move.speed > 40) newAnimation = 'sprint';
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
    
    action.fadeIn(0.5);
    action.play();
  }  
}

const bindEvents = () => {
  document.addEventListener("keydown", onDocumentKeyDown, false);
  document.addEventListener("keyup", onDocumentKeyUp, false);
  
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



const addBushes = () => {
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

    const sphereShape = new CANNON.Box(new CANNON.Vec3(2, 2, 2))
    const sphereBody = new CANNON.Body({ mass: 0, material: objectMat});
    sphereBody.addShape(sphereShape)
    sphereBody.position.x = mesh.position.x
    sphereBody.position.y = mesh.position.y
    sphereBody.position.z = mesh.position.z
    world.addBody(sphereBody)

  }  
}

const addFloor = () => {
  const geometry2 = new THREE.PlaneBufferGeometry(2000,2000);
  const material2 = new THREE.MeshStandardMaterial({color: 0xe3e7ea});
  const plane = new THREE.Mesh(geometry2, material2);
  plane.receiveShadow = true;
  plane.rotation.x = - Math.PI/2;
  plane.position.y = 0;
  scene.add(plane);
  scene.fog = new THREE.Fog(clearColor,60,100);


  const planeShape = new CANNON.Box(new CANNON.Vec3(200, 200, 0.1))
  const groundBody = new CANNON.Body({ mass: 0, material: groundMat  });

  groundBody.addShape(planeShape)
  groundBody.quaternion.copy(plane.quaternion);
  groundBody.position.copy(plane.position);

  world.addBody(groundBody)

}

const addPug = () => {
  

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
    pug.position.x = -20;
    // pug.position.y = 0.5;
    pug.add(object);  

    const pugShape = new CANNON.Box(new CANNON.Vec3(4.5, 3, 1.3))
    pugBody = new CANNON.Body({ mass: 80, material: pugMat});
    pugBody.addShape(pugShape)
    pugBody.angularDamping = 1;

    pugBody.fixedRotation = true
    pugBody.position.set(-20,0,0);
    world.addBody(pugBody)
      
  
    cameraPug.position.set(-50,5,0);    
    
    pug.add(cameraPug);
    
    controls = new OrbitControls( cameraPug, renderer.domElement );  
    controls.minPolarAngle = 0;
    controls.maxPolarAngle =  Math.PI * 0.45;
    
    
    scene.add(pug);
    
    onAnimationFrameHandler();
  })
  
}

const addTreats = () => {
  loader.load(treatModel, object => {
    object.traverse(child => {
      if (child.isMesh) {
        child.material.side = THREE.DoubleSide;
        child.material.shininess = 0.1;
        child.castShadow = true;
      }
    })
    object.scale.multiplyScalar(0.05);
  
    const offset = 100;
    for (let i = 0; i < 200; i++){
      let treat = object.clone();
      
      scene.add(treat);
      treat.position.x = Math.random() * offset - 1 - offset/2;
      treat.position.y = Math.random() * 80;
      treat.rotation.y = Math.random() * offset - 1 - offset/2;
      treat.position.z = Math.random() * offset - 1 - offset/2;
      //treat.position.normalize();
      //treat.position.multiplyScalar( 10 );
      const treatShape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5))
      treat.body = new CANNON.Body({ mass: 10, material: objectMat });
      treat.body.addShape(treatShape)
      treat.body.position.x = treat.position.x
      treat.body.position.y = treat.position.y
      treat.body.position.z = treat.position.z      
      world.addBody(treat.body);
      treats.push(treat);
    }
    
  })
  
}

setupInit();
bindEvents();
addBushes();
addFloor();
addPug();
addTreats();
setupLights();




// render loop
const onAnimationFrameHandler = () => {  
  var dt = clock.getDelta();  
  for (let i = 0; i < mixers.length; i++){    
    mixers[i].update(dt);
  }


  treats.forEach(treat => {    
    treat.position.set(treat.body.position.x, treat.body.position.y, treat.body.position.z);
    treat.quaternion.set(treat.body.quaternion.x, treat.body.quaternion.y, treat.body.quaternion.z, treat.body.quaternion.w);
  })      

  if (pug) {    
    // let newPos = pugBody.position.clone();
    // newPos.y = 0;
    //pugBody.position.lerp(pugBody.position, alpha, newPos);
    pugBody.position.y = 3.75;
    pug.position.set(pugBody.position.x, 0, pugBody.position.z);
    pug.quaternion.set(pugBody.quaternion.x, pugBody.quaternion.y, pugBody.quaternion.z, pugBody.quaternion.w);

    if(pug.userData.move !== undefined && pugBody.position){
    
      if (pug.userData.move.forward > 0 && pug.userData.move.speed < 60) pug.userData.move.speed += 0.1;          

      let forwardVector = new THREE.Vector3(1,0,0).multiplyScalar( pug.userData.move.forward * pug.userData.move.speed);
      var forwardPoint = new CANNON.Vec3(-10,0,0);

      let turnVector1 = new THREE.Vector3(0,0,-40).multiplyScalar(pug.userData.move.turn * pug.userData.move.speed);
      let turnVector2 = new THREE.Vector3(40,0,0).multiplyScalar(pug.userData.move.turn * pug.userData.move.speed);

      let turnPoint1 = new CANNON.Vec3(30,0,0);
      let turnPoint2 = new CANNON.Vec3(-30,0,0);

      pugBody.applyImpulse(forwardVector, forwardPoint);
      pugBody.applyLocalForce(turnVector1, turnPoint1);
      pugBody.applyLocalForce(turnVector2, turnPoint2);

      //pugBody.position.x += pug.userData.move.forward * dt * pug.userData.move.speed;      

      // var rotationQuaternion = new CANNON.Quaternion();
			// rotationQuaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0), pug.rotation.x + pug.userData.move.turn * dt);
			// pugBody.quaternion = rotationQuaternion.mult(pugBody.quaternion);
                  
    }

    
    let targetPosition = pug.position.clone();
    targetPosition.y += 5;
    controls.target.copy(targetPosition);
    controls.update();    
  }
  world.step(dt);
  cannonDebugRenderer.update();      // Update the debug renderer
  renderer.render(scene, cameraPug);  
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
