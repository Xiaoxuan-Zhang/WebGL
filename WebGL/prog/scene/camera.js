/**
 * Specifies a Camera.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Camera}
 */

class Camera {
  /**
   * Constructor for Scene.
   *
   * @constructor
   */
  constructor() {
    this.position = [0.0, 2.0, 2.0];
    this.target = [0.0, 0.0, 0.0];
    this.worldUp = [0, 1, 0];
    this.up = [0, 1, 0];
    this.front = [0, 0, -1];
    this.right = this.getRight();
    this.yaw = -90.0;
    this.pitch = -45.0;
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
    this.update();
  }

  /**
  * move camera in x-z plane
  **/
  move(direction) {
    // move the camera around
    let offset = 0.05;
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
  rotate(direction) {
    var delta_d = 1.0;
    if (direction == "left")
    {
      this.yaw -= delta_d;
    } else if (direction == "right")
    {
      this.yaw += delta_d;
    } else if (direction == "up")
    {
      this.pitch += delta_d;
    } else if (direction == "down")
    {
      this.pitch -= delta_d;
    }
    this.update();
  }

  update() {
    this.front[0] = Math.cos(this.yaw * Math.PI/180.0) * Math.cos(this.pitch * Math.PI/180.0);
    this.front[1] = Math.sin(this.pitch * Math.PI/180.0);
    this.front[2] = Math.sin(this.yaw * Math.PI/180.0) * Math.cos(this.pitch * Math.PI/180.0);
    this.front = this.normalize(this.front);
    this.getRight();
    this.getUp();
  }
  getTarget() {
    //Front + Position
    let target = [0, 0, 0];
    target[0] = this.front[0] + this.position[0];
    target[1] = this.front[1] + this.position[1];
    target[2] = this.front[2] + this.position[2];
    this.target = target;
    return this.target
  }
  getFront() {
    var front = [0, 0, 0];
    front[0] = this.target[0] - this.position[0];
    front[1] = this.target[1] - this.position[1];
    front[2] = this.target[2] - this.position[2];
    this.front = this.normalize(front);
    return this.front;
  }
  getRight() {
    let right = [0, 0, 0];
    let ax = this.front[0], ay = this.front[1], az = this.front[2];
    let bx = this.worldUp[0], by = this.worldUp[1], bz = this.worldUp[2];

    right[0] = ay * bz - az * by;
    right[1] = az * bx - ax * bz;
    right[2] = ax * by - ay * bx;
    this.right = this.normalize(right);
    return this.right;
  }
  getUp() {
    let up = [0, 0, 0];
    let ax = this.right[0], ay = this.right[1], az = this.right[2];
    let bx = this.front[0], by = this.front[1], bz = this.front[2];

    up[0] = ay * bz - az * by;
    up[1] = az * bx - ax * bz;
    up[2] = ax * by - ay * bx;
    this.up = this.normalize(up);
    return this.up;
  }

  normalize(a) {
    let x = a[0];
    let y = a[1];
    let z = a[2];
    let len = x*x + y*y + z*z;
    let out = []
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
    }
    return out;
  }
  getViewMatrix() {
    this.getTarget();
    this.viewMatrix.setLookAt(this.position[0], this.position[1], this.position[2],
                        this.target[0], this.target[1], this.target[2], 0, 1, 0);
    return this.viewMatrix;
  }

  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  getCameraPosition() {
    return this.position;
  }
  updateCameraMatrix() {
    this.projectionMatrix.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
  }
}
