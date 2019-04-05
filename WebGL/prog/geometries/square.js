/**
 * Specifies a Square. A subclass of Geometry.
 *
 * @author "Zhang Xiaoxuan"
 * @this {Square}
 */
class Square extends Geometry {
  /**
   * Constructor for Square.
   *
   * @constructor
   * @param {Number} size The size of the square drawn
   * @param {Number} centerX The center x-position of the square
   * @param {Number} centerY The center y-position of the square
   */
  constructor() {
    // Recommendations: Remember that Square is a subclass of Geometry.
    // "super" keyword can come in handy when minimizing code reuse.
    super();
    this.generateSquareVertices();
  }

  /**
   * Generates the vertices of the square.
   *
   * @private Generate a unit square
   */
  generateSquareVertices() {
      // Recommendations: Might want to call this within your Square constructor.
      // Keeps your code clean :)
      let centerX = 0;
      let centerY = 0;
      let size = 1;
      this.vertices = [centerX - size, centerY + size, 0.0,
                       centerX + size, centerY + size, 0.0,
                       centerX + size, centerY - size, 0.0,
                       centerX - size, centerY + size, 0.0,
                       centerX + size, centerY - size, 0.0,
                       centerX - size, centerY - size, 0.0];
      this.UVs = [0.0, 1.0,
                  1.0, 1.0,
                  1.0, 0.0,
                  0.0, 1.0,
                  1.0, 0.0,
                  0.0, 0.0];
      this.normals = [0, 0, 1,
                      0, 0, 1,
                      0, 0, 1,
                      0, 0, 1,
                      0, 0, 1,
                      0, 0, 1]
  }

}
