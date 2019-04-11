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
  constructor(mapSize, mapScale, lodInfo) {

    //Mesh size is equal to the number of vertices, so the actural size of terrain chunk should be (meshSize-1).
    this.chunkSize = mapSize - 1;
    this.mapScale = mapScale;
    this.mapSize = mapSize;
    this.lodInfo = lodInfo;
    this.maxViewDistance = lodInfo[lodInfo.length - 1];
    this.numOfChunksInView = Math.round(this.maxViewDistance / this.chunkSize);
    this.terrainChunkDict= {};
    this.visibleTerrain= [];
    this.viewUpdateStep = 5.0;
    this.lastViewPos = Object.assign({}, camera.position);
    var uniforms = {
      //u_sample: {type: "texture", value: g_texture["heightMap"]["diffuse"]},
      u_displacement: {type: "f", value: g_terrain["displacement"]},
      u_seaLevel: {type: "f", value: g_terrain["seaLevel"]}
    }
    //The same material is shared across different mesh
    this.material = new Material(uniforms, g_programs["Terrain"]);
    this.updateTerrain();
  }

  /*Override the parent function*/
  render() {
    // Tranform and draw call for each visible terrain mesh
    useShader(gl, this.material.shader);
    light.update();
    //update the latest parameters from GUI
    this.material.uniforms.u_displacement.value = g_terrain["displacement"];
    this.material.uniforms.u_seaLevel.value = g_terrain["seaLevel"];
    this.material.sendUniformToGLSL();
    var lastVerticeLength = 0;
    for (var i = 0; i < this.visibleTerrain.length; i++) {
      if (this.visibleTerrain[i].vertices.length != lastVerticeLength) {
        sendAttributeBufferToGLSL(new Float32Array(this.visibleTerrain[i].vertices), 3, "a_position");
        sendAttributeBufferToGLSL(new Float32Array(this.visibleTerrain[i].normals), 3, "a_normal");
        sendAttributeBufferToGLSL(new Float32Array(this.visibleTerrain[i].UVs), 2, "a_texCoord");
        lastVerticeLength = this.visibleTerrain[i].vertices.length;
      }
      sendUniformMat4ToGLSL(this.visibleTerrain[i].modelMatrix, "u_model");
      sendUniformMat4ToGLSL(camera.getViewMatrix(), 'u_view');
      sendUniformMat4ToGLSL(camera.getProjectionMatrix(), 'u_projection');
      sendUniformVec3ToGLSL(new Float32Array(camera.getCameraPosition()), 'u_cameraPos');

      this.visibleTerrain[i].normalMatrix.setInverseOf(this.visibleTerrain[i].modelMatrix);
      this.visibleTerrain[i].normalMatrix.transpose();
      sendUniformMat4ToGLSL(this.visibleTerrain[i].normalMatrix, 'u_normalMatrix');

      tellGLSLToDrawArrays(this.visibleTerrain[i].vertices.length/3);
    }
  }

  updateAnimation() {
    var distance = camera.getViewDistanceXZ(this.lastViewPos);
    if (distance > this.viewUpdateStep) {
      this.updateTerrain();
      this.lastViewPos = Object.assign({}, camera.position);
    }
  }

  updateTerrain() {
    this.visibleTerrain.length = 0;
    var currentChunkGridX = Math.round(camera.position[0] / (this.chunkSize * this.mapScale));
    var currentChunkGridZ = Math.round(camera.position[2] / (this.chunkSize * this.mapScale));
    for (var zOffset = -this.numOfChunksInView; zOffset <= this.numOfChunksInView; zOffset++) {
      for (var xOffset = -this.numOfChunksInView; xOffset <= this.numOfChunksInView; xOffset++) {
        var gridCoord = [currentChunkGridX + xOffset, 0.0, currentChunkGridZ + zOffset];
        if (this.terrainChunkDict.hasOwnProperty(gridCoord)) {
          this.terrainChunkDict[gridCoord].updateTerrain();
        } else {
          console.log("create mesh for " + gridCoord);
          this.terrainChunkDict[gridCoord] = new Terrain(this.mapSize, this.mapScale, gridCoord, this.lodInfo);

        }
        if (this.terrainChunkDict[gridCoord].visible) {
          this.updateMesh(this.terrainChunkDict[gridCoord].terrainMesh);
          this.visibleTerrain.push(this.terrainChunkDict[gridCoord].terrainMesh);
        }
      }
    }
  }

  updateMesh(mesh) {
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
    this.gridCoord = gridCoord;
    this.terrainScale = terrainScale;
    this.terrainSize = terrainMapSize - 1;
    this.meshPosition = [gridCoord[0] * this.terrainSize * terrainScale, gridCoord[1] * this.terrainSize * terrainScale, gridCoord[2] * this.terrainSize * terrainScale];
    this.terrainMesh = null;
    this.lodMeshes = [];
    this.lodDetails = levelOfDetail;
    this.lastLodIndex = -1;
    this.visible = false;
    for (var i = 0; i < levelOfDetail.length; i ++) {
      var terrainMesh = new Mesh(terrainMapSize, i);
      terrainMesh.translate(this.meshPosition[0], this.meshPosition[1], this.meshPosition[2]);
      terrainMesh.scale(this.terrainScale);
      this.lodMeshes.push(terrainMesh);
    }
    this.updateTerrain();
  }

  calcViewDistance() {
    //Calculate the distance from camera position to the bound (simplified as a circle) of terrain mesh
    var r = Math.sqrt(2 * Math.pow(this.terrainSize * this.terrainScale * 0.5, 2));
    // var distance = Math.sqrt(Math.pow((this.meshPosition[0] - camera.position[0]),2)
    //               + Math.pow((this.meshPosition[2] - camera.position[2]),2)) - r;
    var distance = camera.getViewDistanceXZ(this.meshPosition) - r;
    return distance;
  }

  updateTerrain() {
    var distance = this.calcViewDistance();
    var maxViewDistance = this.lodDetails[this.lodDetails.length - 1];
    this.visible = (distance <= maxViewDistance);
    if (this.visible) {
      var lodIdx = 0;
      for (var i = 0; i < this.lodDetails.length - 1; i ++) {
        if (distance > this.lodDetails[i]) {
          lodIdx = i + 1;
        } else {
          break;
        }
      }
      if (this.lastLodIndex != lodIdx) {
        this.terrainMesh = this.lodMeshes[lodIdx];
        this.lastLodIndex = lodIdx;
      }
    }
  }
}
