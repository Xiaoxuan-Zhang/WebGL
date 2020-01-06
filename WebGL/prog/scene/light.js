/**
 * Specifies a Light.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Light}
 */

class Light {
  /**
   * Constructor for Light.
   *
   * @constructor
   */
  constructor() {
    this.position = new Float32Array([-2.0, 10.0, 5.0]);
    this.color = new Float32Array([1.0, 1.0, 1.0]);
    this.specularColor = new Float32Array([1.0, 1.0, 1.0]);
  }

  sendUniforms() {
    sendUniformVec3ToGLSL(this.position, 'u_lightPos');
    sendUniformVec3ToGLSL(this.color, 'u_lightColor');
    sendUniformVec3ToGLSL(this.specularColor, 'u_specularColor');
  }
}
