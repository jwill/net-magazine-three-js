/* Adapted from MorphAnimation.js
 * https://github.com/mrdoob/three.js/blob/master/src/extras/animation/MorphAnimation.js
 */
PathAnimation = function(mesh, points, y) {
  this.mesh = mesh;
  this.points = points;
  this.y = y;

  this.currentTime = 0;
  this.duration = 20000;
  this.point = 0;
  this.isPlaying = false;
  this.loop = true;

  return this;
}

PathAnimation.prototype = {
  play: function() {
    this.isPlaying = true;
  },
  pause: function() {
    this.isPlaying() = false;
  },
  update: function(delta) {
    if (this.isPlaying === false || this.mesh == undefined) return;
    this.currentTime += delta;
    if (this.loop === true && this.currentTime > this.duration) {
      this.currentTime %= this.duration;
    }
    var interpolation = this.duration / this.points.length;
    this.point = Math.floor(this.currentTime / interpolation);
    var vectorCurrentPoint = this.points[this.point];
    if (vectorCurrentPoint)
      this.mesh.position.set(-vectorCurrentPoint.x, this.y, vectorCurrentPoint.y);
  }
}

window.PathAnimation = PathAnimation;
