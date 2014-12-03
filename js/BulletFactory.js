BulletFactory = function(scene, obj) {
  var self = this;
  self.scene = scene;
  self.obj = obj;
  var loader = new THREE.JSONLoader();
  loader.load('model/projectile.json', function(geometry, material) {
    self.bullet = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(material));
    self.bullet.rotateZ(-1.58);
    self.bullet.scale.set(0.05, 0.05, 0.05);
    self.bullet.position.y = 1.25;
  });

  self.bullets = [];
  self.ray = new THREE.Raycaster();
}

BulletFactory.prototype = {
  shootBullet: function() {
    if (this.bullets.length > 20) {
        console.log("No more bullets for a while.");
        return;
    }
    var b = this.bullet.clone();
    b.name = "bullet"
    var pos = this.obj.position.clone();

    b.position.set(pos.x, pos.y, pos.z);
    b.translateX(-1);
    this.scene.add(b);
    this.bullets.push(b);
  },
  updateBullets: function() {
    for (var i=0; i<this.bullets.length; i++) {
      var b = this.bullets[i];
      // TODO Figure out forward vector
      b.translateY(0.5);
      this.checkCollisions(b,this.obj.position , game.scene.children);
      if (b.position.x < -300 || b.position.x > 300)
        this.removeBullet(b);
    }
  },
  getBullets: function() {
    return this.bullets;
  },
  removeBullet: function(b) {
    game.scene.remove(b);
    index = this.bullets.indexOf(b);
    if (index != -1)
      this.bullets.splice(index, 1);
  },
  checkCollisions: function(b, vec, objects) {
    this.ray.set(b.position.clone(), vec);
    var collResults = this.ray.intersectObjects(objects, true);
    if (collResults.length > 0 && collResults[0].distance < 5) {
      console.log(collResults)
      var object = collResults[0].object;
      object.hit = true;
      this.removeBullet(b);
      return object;
    }
  }
}

window.BulletFactory = BulletFactory;
