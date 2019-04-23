/**
 * Specifies a Camera.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Camera}
 */
var Camera = function() {
  this.position = new Float32Array([0.0, 30.0, 0.0]);
  this.target = new Float32Array([0.0, 0.0, 0.0]);
  this.worldUp = new Float32Array([0, 1, 0]);
  this.up = new Float32Array([0, 1, 0]);
  this.front = new Float32Array([0, 0, -1]);
  this.right = this.getRight();
  this.yaw = -90.0;
  this.pitch = 0.0;
  this.viewMatrix = new Matrix4();
  this.projectionMatrix = new Matrix4();
  this.projectionMatrix.setPerspective(20, canvas.width/canvas.height,0.1, 1000);
  this.deltaTime = 0.0;
  this.lastTime = performance.now();
  this.rotationSpeed = 1.5;
  this.velocity = 5.0;
  this.update();
}

/**
* move camera in x-z plane
**/
Camera.prototype.move = function(direction) {
  // move the camera around
  let offset = this.velocity; //0.05;
  if (direction == "forward" ) {
    this.position[0] += this.front[0] * offset;
    this.position[1] += this.front[1] * offset;
    this.position[2] += this.front[2] * offset;

  } else if (direction == "backward") {
    this.position[0] -= this.front[0] * offset;
    this.position[1] -= this.front[1] * offset;
    this.position[2] -= this.front[2] * offset;
  } else if (direction == "left") {
    this.position[0] += this.right[0] * offset;
    this.position[1] += this.right[1] * offset;
    this.position[2] += this.right[2] * offset;
  } else if (direction == "right"){
    this.position[0] -= this.right[0] * offset;
    this.position[1] -= this.right[1] * offset;
    this.position[2] -= this.right[2] * offset;
  }
}

/**
* rotate camera
**/
Camera.prototype.rotate = function(direction) {
  if (direction == "left")
  {
    this.yaw -= this.rotationSpeed;
  } else if (direction == "right")
  {
    this.yaw += this.rotationSpeed;
  } else if (direction == "up")
  {
    this.pitch += this.rotationSpeed;
  } else if (direction == "down")
  {
    this.pitch -= this.rotationSpeed;
  }
  this.update();
}

Camera.prototype.update = function() {
  let currTime = performance.now();
  this.deltaTime = currTime - this.lastTime;
  this.lastTime = currTime;
  this.front[0] = Math.cos(this.yaw * Math.PI/180.0) * Math.cos(this.pitch * Math.PI/180.0);
  this.front[1] = Math.sin(this.pitch * Math.PI/180.0);
  this.front[2] = Math.sin(this.yaw * Math.PI/180.0) * Math.cos(this.pitch * Math.PI/180.0);
  this.front = this.normalize(this.front);
  this.getRight();
  this.getUp();
}

Camera.prototype.getTarget = function() {
  //Front + Position
  let target = new Float32Array([0, 0, 0]);
  target[0] = this.front[0] + this.position[0];
  target[1] = this.front[1] + this.position[1];
  target[2] = this.front[2] + this.position[2];
  this.target = target;
  return this.target
}

Camera.prototype.getFront = function() {
  let front = new Float32Array([0, 0, 0]);
  front[0] = this.target[0] - this.position[0];
  front[1] = this.target[1] - this.position[1];
  front[2] = this.target[2] - this.position[2];
  this.front = this.normalize(front);
  return this.front;
}

Camera.prototype.getRight = function() {
  let right = new Float32Array([0, 0, 0]);
  let ax = this.front[0], ay = this.front[1], az = this.front[2];
  let bx = this.worldUp[0], by = this.worldUp[1], bz = this.worldUp[2];

  right[0] = ay * bz - az * by;
  right[1] = az * bx - ax * bz;
  right[2] = ax * by - ay * bx;
  this.right = this.normalize(right);
  return this.right;
}

Camera.prototype.getUp = function() {
  let up = new Float32Array([0, 0, 0]);
  let ax = this.right[0], ay = this.right[1], az = this.right[2];
  let bx = this.front[0], by = this.front[1], bz = this.front[2];

  up[0] = ay * bz - az * by;
  up[1] = az * bx - ax * bz;
  up[2] = ax * by - ay * bx;
  this.up = this.normalize(up);
  return this.up;
}

Camera.prototype.normalize = function(a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let len = x*x + y*y + z*z;
  let out = new Float32Array(3);
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
  }
  return out;
}

Camera.prototype.getViewMatrix = function() {
  this.getTarget();
  this.viewMatrix.setLookAt(this.position[0], this.position[1], this.position[2],
                      this.target[0], this.target[1], this.target[2], 0, 1, 0);
  return this.viewMatrix;
}

Camera.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix;
}

Camera.prototype.getCameraPosition = function() {
  return this.position;
}

Camera.prototype.updateCameraMatrix = function() {
  this.projectionMatrix.setPerspective(60, canvas.width/canvas.height, 0.1, 1000);
}

Camera.prototype.getViewDistance = function(target) {
  let distance = Math.sqrt(Math.pow((target[0] - this.position[0]),2)
                + Math.pow((target[1] - this.position[1]),2)
                + Math.pow((target[2] - this.position[2]),2));
  return distance;
}

Camera.prototype.getViewDistanceXZ = function(target) {
  let distance = Math.sqrt(Math.pow((target[0] - this.position[0]),2)
                + Math.pow((target[2] - this.position[2]),2));
  return distance;
}

Camera.prototype.sendUniforms = function() {
  sendUniformMat4ToGLSL(this.getViewMatrix(), 'u_view');
  sendUniformMat4ToGLSL(this.getProjectionMatrix(), 'u_projection');
  sendUniformVec3ToGLSL(this.getCameraPosition(), 'u_cameraPos');
}
