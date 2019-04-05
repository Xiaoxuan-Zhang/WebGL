/**
 * Specifies a PCG terrain.
 *
 * @author "Xiaoxuan Zhang"
 * @this {PCGTerrain}
 */
class PCGTerrain{
  /**
   * Constructor for PCGTerrain.
   *
   * @constructor
   */
  constructor(meshSize) {

    //Mesh size is equal to the number of vertices, so the actural size of terrain chunk should be (meshSize-1).
    this.chunkSize = meshSize - 1;
    this.numOfChunksInView = Math.round(TERRAIN_MAX_VIEW_DISTANCE / this.chunkSize);
    this.terrainChunkDict= {};
  }
  /*Override the parent function*/
  render() {
    // Recommendations: sendUniformVec4ToGLSL(), tellGLSLToDrawCurrentBuffer(),
    // and sendAttributeBufferToGLSL() are going to be useful here.

    /* Since the mesh of each terrain is the same plane, useShader and attribute buffer operations are executed only once.
    */
    //Only execute once
    var keys = Object.keys(this.terrainChunkDict);
    if (keys.length > 0) {
      var material = this.terrainChunkDict[keys[0]].terrainMesh.material;
      var vertices = this.terrainChunkDict[keys[0]].terrainMesh.vertices;
      var normals = this.terrainChunkDict[keys[0]].terrainMesh.normals;
      var UVs = this.terrainChunkDict[keys[0]].terrainMesh.UVs;
      useShader(gl, material.shader);
      light.update();

      if (vertices.length != 0) {
        sendAttributeBufferToGLSL(new Float32Array(vertices), 3, "a_position");
      }
      if (normals.length != 0) {
        sendAttributeBufferToGLSL(new Float32Array(normals), 3, "a_normal");
      }
      if (UVs.length != 0) {
        sendAttributeBufferToGLSL(new Float32Array(UVs), 2, "a_texCoord");
      }
      material.sendUniformToGLSL();
    }

    for (var i = 0; i < keys.length; i++) {
      if (this.terrainChunkDict[keys[i]].terrainMesh.visible) {
        // execute for each terrain
        sendUniformMat4ToGLSL(this.terrainChunkDict[keys[i]].terrainMesh.modelMatrix, "u_model");
        sendUniformMat4ToGLSL(camera.getViewMatrix(), 'u_view');
        sendUniformMat4ToGLSL(camera.getProjectionMatrix(), 'u_projection');
        sendUniformVec3ToGLSL(new Float32Array(camera.getCameraPosition()), 'u_cameraPos');

        this.terrainChunkDict[keys[i]].terrainMesh.normalMatrix.setInverseOf(this.terrainChunkDict[keys[i]].terrainMesh.modelMatrix);
        this.terrainChunkDict[keys[i]].terrainMesh.normalMatrix.transpose();
        sendUniformMat4ToGLSL(this.terrainChunkDict[keys[i]].terrainMesh.normalMatrix, 'u_normalMatrix');

        tellGLSLToDrawArrays(this.terrainChunkDict[keys[i]].terrainMesh.vertices.length/3);
      }
    }
  }

  updateAnimation() {
    var currentChunkGridX = Math.round(camera.position[0] / this.chunkSize);
    var currentChunkGridZ = Math.round(camera.position[2] / this.chunkSize);
    for (var zOffset = -this.numOfChunksInView; zOffset <= this.numOfChunksInView; zOffset++) {
      for (var xOffset = -this.numOfChunksInView; xOffset <= this.numOfChunksInView; xOffset++) {
        var gridCoord = [currentChunkGridX + xOffset, 0.0, currentChunkGridZ + zOffset];
        if (this.terrainChunkDict.hasOwnProperty(gridCoord)) {
          this.terrainChunkDict[gridCoord].updateTerrain();
          if (this.terrainChunkDict[gridCoord].terrainMesh.visible) {
            //Do something;
            this.update(this.terrainChunkDict[gridCoord].terrainMesh);
          }
        } else {
          this.terrainChunkDict[gridCoord] = new Terrain(TERRAIN_MAP_SIZE, TERRAIN_SCALE, gridCoord, 0);
        }
      }
    }
  }

  update(mesh) {
    mesh.modelMatrix.setTranslate(mesh.translateX, mesh.translateY, mesh.translateZ);
    mesh.modelMatrix.scale(mesh.scaleValue, mesh.scaleValue, mesh.scaleValue);
  }
}

class Terrain {
  /**
   * Constructor for Terrain.
   *
   * @constructor
   */
  constructor(terrainMapSize, terrainScale, gridCoord, levelOfDetail) {
    this.terrainMesh = new Mesh(terrainMapSize, levelOfDetail);
    this.gridCoord = gridCoord;
    this.terrainSize = terrainMapSize - 1;
    this.meshPosition = [gridCoord[0] * this.terrainSize, gridCoord[1] * this.terrainSize, gridCoord[2] * this.terrainSize];
    this.terrainMesh.translate(this.meshPosition[0], this.meshPosition[1], this.meshPosition[2]);
    this.terrainMesh.scale(terrainScale);
    var uniforms = {
      //u_sample: {type: "texture", value: g_texture["heightMap"]["diffuse"]},
      u_displacement: {type: "f", value: TERRAIN_DISPLACEMENT},
      u_seaLevel: {type: "f", value: TERRAIN_SEA_LEVEL}
    }
    var material = new Material(uniforms, g_programs["Terrain"])
    this.terrainMesh.addMaterial(material);
  }

  calcViewDistance() {
    var distance = Math.sqrt(Math.pow((this.meshPosition[0] - camera.position[0]),2)
                  + Math.pow((this.meshPosition[2] - camera.position[1]),2));
    return distance;
  }

  updateTerrain() {
    var distance = this.calcViewDistance();
    var visible = (distance <= TERRAIN_MAX_VIEW_DISTANCE);
    this.terrainMesh.visible = visible;
  }
}
