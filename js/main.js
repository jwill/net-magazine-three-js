

var Game = (function() {
  var self = this;
  var height, width, fov, aspect, near, far;
  var animation;
  height = 480;
  width = 640;

  fov = 45;
  aspect = width/height;
  near = 0.1; far = 10000;

  self.wasPressed = {};
  self.clock = new THREE.Clock();
  self.keyboard = new THREEx.KeyboardState();
  self.renderer = new THREE.WebGLRenderer();
  self.renderer.setSize(width, height);

  self.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  self.camera.position.y = 5;
  self.camera.position.z = 30;


  self.godCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  self.godCamera.position.y = 400;
  self.godCamera.lookAt(new THREE.Vector3(0,0,0));

  self.currentCamera = self.camera;

  // Add lighting
  var light = new THREE.DirectionalLight(0xFFFFFF, 0.75);

  light.position.set(0,200, 40);

  self.scene = new THREE.Scene();
  self.scene.add(this.camera);
  self.scene.add(light);

  var ambLight = new THREE.AmbientLight(0x404040);
  self.scene.add(ambLight);

  document.querySelector('#c').appendChild(this.renderer.domElement)

  // Make sure change camera doesn't auto repeat
  self.keyboard.domElement.addEventListener('keyup', function(event){
    if (self.keyboard.eventMatches(event, 'Y')) {
      self.wasPressed['Y'] = false;
    }
  });

  return self;
});

Game.prototype.processKeys = function(delta) {
  //var delta = root.clock.getDelta();
  var keyboard = this.keyboard;
  var moveDelta = 20 * delta;

  if (keyboard.pressed('W')) {
    this.tank.translateX(moveDelta);
  }
  if (keyboard.pressed('S')) {
    this.tank.translateX(-moveDelta);
  }
  if (keyboard.pressed('A')) {
    this.tank.rotateOnAxis( new THREE.Vector3(0,1,0), 0.1);
  }
  if (keyboard.pressed('D')) {
    this.tank.rotateOnAxis( new THREE.Vector3(0,1,0), -0.1);
  }
  if (keyboard.pressed('space')) {
    this.factory.shootBullet(this.tank);
  }

  if (keyboard.pressed('B') && !this.wasPressed['B']) {
    // toggle bounding boxes
    this.wasPressed['B'] = true;
    for (i in this.bboxes) {
      this.bboxes[i].visible = !this.bboxes[i].visible
    }
  }

  // Change camera
  if (keyboard.pressed('Y') && !this.wasPressed['Y']) {
    this.wasPressed['Y'] = true;
    if (this.currentCamera === this.tankCamera)
      this.currentCamera = this.camera;
    else this.currentCamera = this.tankCamera;
  }

  this.updateBoundingBoxes();
}

Game.prototype.render = function(delta) {
  var self = this;
  if ( self.animation ) {
    self.animation.update(1000 * delta);
  }
  if (self.enemyPath) {
    self.enemyPath.update(1000 * delta);
  }
  if (self.gunnerPath) {
    self.gunnerPath.update(1000 * delta);
  }
  if (self.factory) {
    self.factory.updateBullets();
  }
  self.renderer.render(self.scene, self.currentCamera);
}

window.animate = function() {
  requestAnimationFrame(window.animate);
  var delta = window.game.clock.getDelta();
  window.game.processKeys(delta);
  window.game.render(delta);
}

Game.prototype.loadScene = function() {
  var planeMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(400,550 ,32),
    new THREE.MeshPhongMaterial({color: 0x085A14, side: THREE.DoubleSide})
  )
  planeMesh.rotation.x = -1.58
  //planeMesh.scale.set(5, 5)
  planeMesh.position.set(0,0,0)
  this.scene.add(planeMesh)

  this.initModels();
}

Game.prototype.updateBoundingBoxes = function() {
  for (index in game.bboxes) {
    game.bboxes[index].update();
  }
}

Game.prototype.createEnemyTank = function() {
  var tank = this.tank.clone();
  var material = this.tank.material.clone();
  material.color.set(0x550055);

  tank.material = material;
  tank.position.set(0,0,-5);
  this.scene.add(tank);

  var curve = new THREE.EllipseCurve(
    0,  -170,            // ax, aZ
    70, 120,         // xRadius, yRadius
    0,2 * Math.PI,  // aStartAngle, aEndAngle
    false             // aClockwise
  );
  var points = curve.getPoints(1000);
  this.enemyPath = new PathAnimation(tank, points, 0.5);
  this.enemyPath.play();
}

Game.prototype.initModels = function() {
  var scope = this;
  // Create bounding box helpers array
  game.bboxes = []

  var loader = new THREE.JSONLoader();
  loader.load('model/tank_distribution.json', function(geometry, material) {
    var texture = THREE.ImageUtils.loadTexture("model/traveller_1.png");
    var material = new THREE.MeshLambertMaterial({color:0xFFFFFF, map:texture});
    scope.tank = new THREE.Mesh(geometry, material);
    scope.tank.position.y = 0.4;
    scope.scene.add(scope.tank);

    // hide this object later
    var lookAtHelper = new THREE.Mesh(
      new THREE.BoxGeometry(0.25,0.25,0.25),
      new THREE.MeshBasicMaterial({color: 0xFFFFFF}),
      0
    )
    var tankPos = scope.tank.position;
    lookAtHelper.position.set(tankPos.x + 4, tankPos.y + 1, tankPos.z);
    //scope.tank.add(lookAtHelper);

    scope.tankCamera = new THREE.PerspectiveCamera(45, 1.3333, 0.01, 1000);
    scope.tankCamera.position.set(tankPos.x-0.25, tankPos.y + 0.75, tankPos.z);
    scope.tankCamera.lookAt(lookAtHelper.position);
    scope.tank.add(scope.tankCamera);


    var bbox = new THREE.BoundingBoxHelper( scope.tank);
    bbox.update();
    game.bboxes.push(bbox);
    scope.scene.add( bbox );

    scope.factory = new BulletFactory(scope.scene, scope.tank);

    scope.createEnemyTank();
  });

  loader.load('model/soldier.json', function(geometry, material) {
    var texture = THREE.ImageUtils.loadTexture("model/poss_body.png");
    var material = new THREE.MeshLambertMaterial({color:0xFFFFFF, map:texture, morphTargets: true});
    scope.human = new THREE.MorphAnimMesh(geometry, material);
    scope.human.position.y = 0.4;
    scope.human.position.x = 5;
    // Set scale to 5% of original
    scope.human.scale.set(0.05, 0.05, 0.05);
    scope.scene.add(scope.human);

    //scope.animation = new THREE.MorphAnimation( scope.human );
    //scope.animation.play();
  });

  loader.load('model/chaingunner.json', function(geometry, material) {
    var texture = THREE.ImageUtils.loadTexture("model/chaingunner_body.png");
    var material = new THREE.MeshLambertMaterial({color:0xFFFFFF, map:texture, morphTargets: true});
    scope.human2 = new THREE.MorphAnimMesh(geometry, material);
    scope.human2.position.y = 0.4;
    scope.human2.position.x = 8;
    // Set scale to 5% of original
    scope.human2.scale.set(0.5, 0.5, 0.5);
    scope.scene.add(scope.human2);

    scope.animation = new THREE.MorphAnimation( scope.human2 );
    scope.animation.play();
  });

  loader.load('model/palm2.json', function(geometry, material) {
    var texture = THREE.ImageUtils.loadTexture("model/canopy.png");
    var material = new THREE.MeshLambertMaterial({color:0xFFFFFF, map:texture});
    scope.palm = new THREE.Mesh(geometry, material);
    scope.palm.position.y = 0.4;
    scope.palm.position.x = -8;
    // Set scale to 30% of original
    scope.palm.scale.set(0.3, 0.3, 0.3);
    var palm_clone = scope.palm.clone();
    scope.scene.add(scope.palm);

    palm_clone.rotation.y = THREE.Math.degToRad(180);
    scope.scene.add(palm_clone);
  });

  loader.load('model/bunker.json', function(geometry, material) {
    scope.bunker = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(material));
    scope.bunker.position.y = -0.8;
    scope.bunker.position.z = -200;
    scope.bunker.rotation.y = 90;
    scope.bunker.scale.set(10, 10, 10);
    scope.scene.add(scope.bunker);
  });
}

Game.prototype.placePalms = function() {

}

function getRoot() {
  return game;
}

var game = new Game();
game.loadScene();
animate();
