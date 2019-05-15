/**
 * Specifies a geometric object.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Geometry}
 */
class Geometry {
  /**
   * Constructor for Geometry.
   *
   * @constructor
   */
  constructor(material=null) {
    this.vertices = []; // an array of vertices with coordinates of x,y,z
    this.normals = []; //the corresponding normals to each vertex
    this.UVs = []; //the corresponding UV to each vertex
    this.indices = [];
    this.modelMatrix = new Matrix4(); // Model matrix applied to geometric object
    this.normalMatrix = new Matrix4();
    this.bufferDataUpdated = {};
    this.attributes = {}; // List of attributes that might be including color, position...
    this.translateX = 0;
    this.translateY = 0;
    this.translateZ = 0;
    this.scaleValue = [1.0, 1.0, 1.0];
    this.rotation = 0.0;
    this.rotationAxis = [0, 0, 1];
    this.autoRotate = false;
    this.angle = 0.0;
    this.visible = true;

    this.now = performance.now();
    if (material != null) {
      this.addMaterial(material)
    }
  }
  //Optional
  addMaterial(materialObj) {
    this.material = materialObj;
    this.init();
  }
  init() {
    useShader(gl, this.material.shader);
    this.bufferDataUpdated['Vertices'] = {buffer: createBufferData(new Float32Array(this.vertices)), dataCount: 3, binded: true};
    this.bufferDataUpdated['UVs'] = {buffer: createBufferData(new Float32Array(this.UVs)), dataCount: 2, binded: true};
    this.bufferDataUpdated['Normals'] = {buffer: createBufferData(new Float32Array(this.normals)), dataCount: 3, binded: true};
  }
  /**
   * Add attributes to this geometry
   *
   * @public
   * @param {String} name attribute name
   * @param {Object} value an object containing the value of this attribute
   * @param {int} elements the number of elements to read every time
   */
  addAttributes(name, value, elements) {
    let attr = {}
    attr.value = value;
    attr.elements = elements;
    this.attributes.name = attr;
  }

  translate(x, y, z) {
    this.translateX = x;
    this.translateY = y;
    this.translateZ = z;
  }
  scale(scale) {
    this.scaleValue = scale;
  }
  rotate(degree, axis) {
    this.rotation = degree;
    this.rotationAxis = axis;
  }

  /**
   * Renders this Geometry within your webGL scene.
   */
  render() {

    useShader(gl, this.material.shader);

    light.sendUniforms();
    camera.sendUniforms();

    if (this.vertices.length != 0) {
      sendAttributeBufferToGLSL(this.bufferDataUpdated['Vertices'].buffer, this.bufferDataUpdated['Vertices'].dataCount, "a_position");
    }
    if (this.normals.length != 0) {
      sendAttributeBufferToGLSL(this.bufferDataUpdated['Normals'].buffer, this.bufferDataUpdated['Normals'].dataCount, "a_normal");
    }
    if (this.UVs.length != 0) {
      sendAttributeBufferToGLSL(this.bufferDataUpdated['UVs'].buffer, this.bufferDataUpdated['UVs'].dataCount, "a_texCoord");
    }

    this.material.sendUniformToGLSL();

    sendUniformMat4ToGLSL(this.modelMatrix, "u_model");
    sendUniformMat4ToGLSL(camera.getViewMatrix(), 'u_view');
    sendUniformMat4ToGLSL(camera.getProjectionMatrix(), 'u_projection');
    sendUniformVec3ToGLSL(new Float32Array(camera.getCameraPosition()), 'u_cameraPos');

    this.normalMatrix.setInverseOf(this.modelMatrix);
    this.normalMatrix.transpose();
    sendUniformMat4ToGLSL(this.normalMatrix, 'u_normalMatrix');

    tellGLSLToDrawArrays(this.vertices.length/3);

  }

  /**
   * Responsible for updating the geometry's modelMatrix for animation.
   * Does nothing for non-animating geometry.
   */
  updateAnimation() {
    this.modelMatrix.setTranslate(this.translateX, this.translateY, this.translateZ);
    this.modelMatrix.scale(this.scaleValue[0], this.scaleValue[1], this.scaleValue[2]);

    if (this.autoRotate) {
      var elapsed = performance.now() - this.now;
      this.now = performance.now();
      this.angle += (10 * elapsed) / 1000.0;
      this.angle %= 360;
      this.modelMatrix.rotate(this.angle, 0, 1, 1);
    } else {
      this.modelMatrix.rotate(this.rotation, this.rotationAxis[0], this.rotationAxis[1], this.rotationAxis[2]);
    }
  }

}
