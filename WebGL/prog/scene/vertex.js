/**
 * Specifies a vertex.
 *
 * @author "Your Name Here"
 * @this {Vertex}
 */
class Vertex {
  constructor(x, y, z, uv = [], color = []) {
    this.points = new Vector3([x, y, z]); // May want to use a vector3 instead
    this.uv = uv;
    this.normal = new Vector3();
  }
  set_texCoords(u, v) {
    this.uv = [u, v];
  }
}
