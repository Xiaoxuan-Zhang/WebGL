/**
 * Specifies a cube. A subclass of Geometry.
 *
 * @author "Zhang Xiaoxuan"
 * @this {Cube}
 */
class Cube extends Geometry {
  /**
   * Constructor for cube.
   *
   * @constructor
   * @param {Number} size The size of the cube drawn
   * @param {Number} centerX The center x-position of the cube
   * @param {Number} centerY The center y-position of the cube
   */
  constructor(size, centerX, centerY) {
    //
    // YOUR CODE HERE
    //

    // Recommendations: Remember that cube is a subclass of Geometry.
    // "super" keyword can come in handy when minimizing code reuse.
    super();
    this.vertices = this.generateCubeVertices(size, centerX, centerY, 0.0);
  }

  /**
   * Generates the vertices of the cube.
   *
   * @private
   * @param {Number} size The size of the cube drawn
   * @param {Number} centerX The center x-position of the cube
   * @param {Number} centerY The center y-position of the cube
   * @param {Number} centerZ The center z-position of the cube
   * @param {Array} color a color for this geometry, if null, generate random color for each vertex
   */
  generateCubeVertices(size, centerX, centerY, centerZ) {
    /*
      4- - -5
     /|    /|
    0- - -1 |
    | |   | |
    | 7- -|-6
    |/    |/
    3- - -2
  */
    var vertices = [
      //front
      new Vertex(centerX - size, centerY + size, centerZ + size, [0.0, 1.0], this.color), //0
      new Vertex(centerX + size, centerY + size, centerZ + size, [1.0, 1.0], this.color), //1
      new Vertex(centerX + size, centerY - size, centerZ + size, [1.0, 0.0], this.color), //2

      new Vertex(centerX - size, centerY + size, centerZ + size, [0.0, 1.0], this.color), //0
      new Vertex(centerX + size, centerY - size, centerZ + size, [1.0, 0.0], this.color), //2
      new Vertex(centerX - size, centerY - size, centerZ + size, [0.0, 0.0], this.color), //3

      //left
      new Vertex(centerX - size, centerY + size, centerZ + size, [1.0, 1.0], this.color), //0
      new Vertex(centerX - size, centerY - size, centerZ + size, [1.0, 0.0], this.color), //3
      new Vertex(centerX - size, centerY - size, centerZ - size, [0.0, 0.0], this.color), //7

      new Vertex(centerX - size, centerY + size, centerZ + size, [1.0, 1.0], this.color), //0
      new Vertex(centerX - size, centerY - size, centerZ - size, [0.0, 0.0], this.color), //7
      new Vertex(centerX - size, centerY + size, centerZ - size, [0.0, 1.0], this.color), //4

      //right
      new Vertex(centerX + size, centerY + size, centerZ + size, [0.0, 1.0], this.color), //1
      new Vertex(centerX + size, centerY + size, centerZ - size, [1.0, 1.0], this.color), //5
      new Vertex(centerX + size, centerY - size, centerZ - size, [1.0, 0.0], this.color), //6

      new Vertex(centerX + size, centerY + size, centerZ + size, [0.0, 1.0], this.color), //1
      new Vertex(centerX + size, centerY - size, centerZ - size, [1.0, 0.0], this.color), //6
      new Vertex(centerX + size, centerY - size, centerZ + size, [0.0, 0.0], this.color), //2

      //top
      new Vertex(centerX - size, centerY + size, centerZ + size, [0.0, 0.0], this.color), //0
      new Vertex(centerX - size, centerY + size, centerZ - size, [0.0, 1.0], this.color), //4
      new Vertex(centerX + size, centerY + size, centerZ - size, [1.0, 1.0], this.color), //5

      new Vertex(centerX - size, centerY + size, centerZ + size, [0.0, 0.0], this.color), //0
      new Vertex(centerX + size, centerY + size, centerZ - size, [1.0, 1.0], this.color), //5
      new Vertex(centerX + size, centerY + size, centerZ + size, [1.0, 0.0], this.color), //1

      //bottom
      new Vertex(centerX - size, centerY - size, centerZ + size, [0.0, 1.0], this.color), //3
      new Vertex(centerX - size, centerY - size, centerZ - size, [0.0, 0.0], this.color), //7
      new Vertex(centerX + size, centerY - size, centerZ - size, [1.0, 0.0], this.color), //6

      new Vertex(centerX - size, centerY - size, centerZ + size, [0.0, 1.0], this.color), //3
      new Vertex(centerX + size, centerY - size, centerZ - size, [1.0, 0.0], this.color), //6
      new Vertex(centerX + size, centerY - size, centerZ + size, [1.0, 1.0], this.color), //2

      //back
      new Vertex(centerX - size, centerY + size, centerZ - size, [1.0, 1.0], this.color), //4
      new Vertex(centerX + size, centerY + size, centerZ - size, [0.0, 1.0], this.color), //5
      new Vertex(centerX + size, centerY - size, centerZ - size, [0.0, 0.0], this.color), //6

      new Vertex(centerX - size, centerY + size, centerZ - size, [1.0, 1.0], this.color), //4
      new Vertex(centerX + size, centerY - size, centerZ - size, [0.0, 0.0], this.color), //6
      new Vertex(centerX - size, centerY - size, centerZ - size, [1.0, 0.0], this.color) //7

    ];
    return vertices;
  }

  generateUVCoordinates() {

  }
}
