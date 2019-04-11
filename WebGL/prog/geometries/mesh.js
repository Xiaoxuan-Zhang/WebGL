/**
 * Specifies a mesh.
 *
 * @author "Zhang Xiaoxuan"
 * @this {Mesh}
 */
class Mesh extends Geometry {
  /**
   * Constructor for mesh.
   *
   * @constructor
   * @param {Number} meshSize The size of a square mesh, equals to the number of vertices on each side
   * @param {Number} levelOfDetail Level of detail
   */
  constructor(meshSize, levelOfDetail) {
    // "super" keyword can come in handy when minimizing code reuse.
    super();
    this.meshSize = meshSize;
    if (levelOfDetail == 0) {
      this.increment = 1;
    } else {
      this.increment = levelOfDetail * 2;
    }
    this.createMesh();
  }

  /**
   * Generates the vertices of the map.
   *
   * @private Generate a map
   */
  createMesh() {
    this.vertices = [];
    this.UVs = [];
    this.normals = [];
    this.indices = [];
    var topLeftX = (this.meshSize - 1) / -2.0;
    var topLeftZ = (this.meshSize - 1) / 2.0;
    for (var i = 0; i < this.meshSize - 1; i += this.increment) {
      for (var j = 0; j < this.meshSize - 1; j += this.increment) {
        this.vertices.push(topLeftX + i, 0, topLeftZ - j,
                          topLeftX + i, 0, topLeftZ - j - this.increment,
                          topLeftX + i + this.increment, 0, topLeftZ - j - this.increment,
                          topLeftX + i + this.increment, 0, topLeftZ - j - this.increment,
                          topLeftX + i + this.increment, 0, topLeftZ - j,
                          topLeftX + i, 0, topLeftZ - j);
        this.UVs.push(i / this.meshSize, j / this.meshSize,
                      i / this.meshSize, (j + this.increment) / this.meshSize,
                      (i + this.increment)/this.meshSize, (j + this.increment) / this.meshSize,
                      (i + this.increment)/this.meshSize, (j + this.increment) / this.meshSize,
                      (i + this.increment)/this.meshSize, j / this.meshSize,
                      i / this.meshSize, j / this.meshSize);
        this.normals.push(0, 1, 0,
                          0, 1, 0,
                          0, 1, 0,
                          0, 1, 0,
                          0, 1, 0,
                          0, 1, 0);
      }
    }
  }

}
