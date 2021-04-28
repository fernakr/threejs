/**
 * entry.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

//import * as THREE from 'three';
import { THREE } from 'enable3d'
import { AmmoPhysics, ExtendedMesh, PhysicsLoader } from '@enable3d/ammo-physics'



import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import pugModel from './assets/models/pug/pug.fbx';
import treatModel from './assets/models/treat/treat.fbx';
//import ammoLib from './assets/ammo/ammo.wasm.js';


const MainScene = () => {

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

  // physics
  const physics = new AmmoPhysics(scene)
  physics.debug.enable()
  //const world = new CANNON.World()
  //const { factory } = physics

  //var cannonDebugRenderer = new THREE.CannonDebugRenderer( scene, world );


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
      start: 310,
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

  const init = () => {

    // renderer
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(clearColor, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // world.gravity.set(0, -9.82, 0)
    // world.addContactMaterial(contactMaterial);
    // world.addContactMaterial(contactMaterial2);
    // world.addContactMaterial(contactMaterial3);
    // world.addContactMaterial(contactMaterial4);

  }
  const playerControl = (forward, turn, jump) => {

    //console.log('jump', jump)
    if (forward === 0 && turn === 0 && !jump){
      delete pug.userData.move;
    }else{
      forward = forward || 0;
      turn = turn || 0;
      if (pug.userData.move){
        pug.userData.move.forward = forward;
        pug.userData.move.turn = turn;
      }else{
        pug.userData.move = { forward, turn, time: clock.getElapsedTime(), speed: 23 };
      }
      pug.userData.move.jump = jump;
    }

//    console.log(pug.userData.move)
  }


  const onDocumentKeyDown = (event) => {
      const keyCode = event.keyCode;
      let forward = (pug.userData.move!==undefined) ? pug.userData.move.forward : 0;
      let turn = (pug.userData.move!==undefined) ?  pug.userData.move.turn : 0;
      let jump = (pug.userData.move!==undefined) ?  pug.userData.move.jump : false;

      //console.log(keyCode);
      switch(keyCode){
        case 32:
          jump = true;
          break;
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
          turn = -1;
          break;
        case 68:
        case 39://D
          turn = 1;
          break;
      }


      playerControl(forward,turn, jump);
      updateAnimation();
  };


  const onDocumentKeyUp = (event) => {
    //console.log(event.keyCode);

    let forward = ( pug.userData && pug.userData.move!==undefined) ? pug.userData.move.forward : 0;
    let turn = (pug.userData && pug.userData.move!==undefined) ?  pug.userData.move.turn : 0;
    let jump = (pug.userData && pug.userData.move!==undefined) ?  pug.userData.move.jump : false;

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


    playerControl(forward, turn, jump);
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
    if (pug.userData && pug.userData.jumping) newAnimation = 'jump';



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
      physics.add.existing(mesh)

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

    physics.add.ground({ width: 2000, height: 2000 })
  }
  const createTriangleShapeByBufferGeometry = (geometry, scalingFactor) => {
    var mesh = new Ammo.btTriangleMesh(true, true);
    var vertexPositionArray = geometry.attributes.position.array;
    for (var i = 0; i < geometry.attributes.position.count/3; i++) {
            mesh.addTriangle(
                new Ammo.btVector3(vertexPositionArray[i*9+0]*scalingFactor, vertexPositionArray[i*9+1]*scalingFactor, vertexPositionArray[i*9+2]*scalingFactor ),
                new Ammo.btVector3(vertexPositionArray[i*9+3]*scalingFactor, vertexPositionArray[i*9+4]*scalingFactor, vertexPositionArray[i*9+5]*scalingFactor),
                new Ammo.btVector3(vertexPositionArray[i*9+6]*scalingFactor, vertexPositionArray[i*9+7]*scalingFactor, vertexPositionArray[i*9+8]*scalingFactor),
                false
            );
    }
    var shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);
    return shape;
}




  const addPug = () => {

    let shape;
    loader.load(pugModel, object => {
      object.traverse(child => {
        if (child.type === 'SkinnedMesh') {
          shape = createTriangleShapeByBufferGeometry(child.geometry,1);
        }
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
      //object.rotateY(Math.PI/2);
      pug = new THREE.Object3D();
      pug.position.x = -20;
      pug.position.y = 10.5;

      pug.add(object);
      pug.add(shape);
      physics.add.existing(pug);
      pug.body.setAngularFactor( 0, 1, 0 );
      pug.body.on.collision((otherObject, event) => {
        //console.log(otherObject.name);
        if (otherObject.name === 'body_id_19') { // ground
          pug.userData.jumping = false;
          if (pug.userData.move) pug.userData.move.jump = false;
          updateAnimation();
        }
      })

      cameraPug.position.set(0,5,-50);

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
        physics.add.existing(treat)

        treats.push(treat);
      }

    })

  }

  init();
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

    if (pug) {

      if(pug.userData.move){
        if (pug.userData.move.forward > 0 && pug.userData.move.speed < 60) pug.userData.move.speed += 1;


        if (pug.userData.move.jump && !pug.userData.jumping) {
          pug.userData.move.jump = false;
          pug.userData.jumping = true;
          pug.body.applyForceY(6);


        }

        if (pug.userData.move.forward && !pug.userData.jumping) {
          const speed = pug.userData.move.speed
          const rotation = pug.getWorldDirection(pug.rotation.toVector3())
          const theta = Math.atan2(rotation.x, rotation.z)

          const x = Math.sin(theta) * speed * pug.userData.move.forward,
            y = pug.body.velocity.y * pug.userData.move.forward,
            z = Math.cos(theta) * speed * pug.userData.move.forward

          pug.body.setVelocity(x, y, z)
        }
        const turnFactor = pug.userData.move.forward >= 0 ? -1 : 1;
        pug.body.setAngularVelocityY(turnFactor*pug.userData.move.turn )
      }

      if (!pug.userData.move || pug.userData.move.turn === 0) pug.body.setAngularVelocityY(0);
      if (!pug.userData.move || pug.userData.move.forward === 0) {
        pug.body.setVelocityX(0)
        pug.body.setVelocityZ(0)
      }

      let targetPosition = pug.position.clone();
      targetPosition.y += 5;
      controls.target.copy(targetPosition);
      controls.update();
    }
    physics.update(dt * 1000)
    physics.updateDebugger()

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
}
//
PhysicsLoader('./src/assets/ammo', () => MainScene())
