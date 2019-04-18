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
    this.chunkScale = mapScale;
    this.mapSize = mapSize;
    this.lodInfo = lodInfo;
    this.maxViewDistance = lodInfo[lodInfo.length - 1];
    this.numOfChunksInView = Math.round(this.maxViewDistance / (this.chunkSize * this.chunkScale));
    this.terrainChunkDict= {};
    this.visibleTerrainDict= {};
    this.viewUpdateStep = 5.0;
    this.lastViewPos = Object.assign({}, camera.position);
    let uniforms = {
      //u_sample: {type: "texture", value: g_texture["heightMap"]["diffuse"]},
      u_displacement: {type: "f", value: g_terrain["displacement"]},
      u_terrain: {type: "v3", value: [g_terrain["water"], 0.0, g_terrain["snow"]]},
      u_noise: {type: "v3", value: [g_terrain["persistance"], g_terrain["lacunarity"], g_terrain["exponent"]]},
      u_mouse: {type:"v2", value: g_mousePos}
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
    this.updateUniforms();
    sendUniformMat4ToGLSL(camera.getViewMatrix(), 'u_view');
    sendUniformMat4ToGLSL(camera.getProjectionMatrix(), 'u_projection');
    sendUniformVec3ToGLSL(camera.getCameraPosition(), 'u_cameraPos');

    for (let key in this.visibleTerrainDict) {
      let terrainList = this.visibleTerrainDict[key];
      for (let i = 0; i < terrainList.length; i++) {
        if (i == 0) {
          sendAttributeBufferToGLSL(terrainList[0].vertices, 3, "a_position");
          sendAttributeBufferToGLSL(terrainList[0].normals, 3, "a_normal");
          sendAttributeBufferToGLSL(terrainList[0].UVs, 2, "a_texCoord");
        }
        sendUniformMat4ToGLSL(terrainList[i].modelMatrix, "u_model");
        terrainList[i].normalMatrix.setInverseOf(terrainList[i].modelMatrix);
        terrainList[i].normalMatrix.transpose();
        sendUniformMat4ToGLSL(terrainList[i].normalMatrix, 'u_normalMatrix');
        tellGLSLToDrawArrays(terrainList[i].vertices.length/3);
      }
    }
  }

  updateUniforms() {
    //update the latest parameters from GUI
    this.material.uniforms.u_displacement.value = g_terrain["displacement"];
    this.material.uniforms.u_terrain.value = [g_terrain["water"], 0.0, g_terrain["snow"]];
    this.material.uniforms.u_noise.value = [g_terrain["persistance"], g_terrain["lacunarity"], g_terrain["exponent"]];
    if (g_terrain.updateMouse){
      this.material.uniforms.u_mouse.value = g_mousePos;
    } else {
      this.material.uniforms.u_mouse.value = [0.0, 0.0];
    }

    this.material.sendUniformToGLSL();
  }

  updateAnimation() {
    let distance = camera.getViewDistanceXZ(this.lastViewPos);
    if (distance > this.viewUpdateStep) {
      this.updateTerrain();
      this.lastViewPos = Object.assign({}, camera.position);
    }
  }

  updateTerrain() {
    this.visibleTerrainDict = {};
    let currentChunkGridX = Math.round(camera.position[0] / (this.chunkSize * this.chunkScale));
    let currentChunkGridZ = Math.round(camera.position[2] / (this.chunkSize * this.chunkScale));
    for (let zOffset = -this.numOfChunksInView; zOffset <= this.numOfChunksInView; zOffset++) {
      for (let xOffset = -this.numOfChunksInView; xOffset <= this.numOfChunksInView; xOffset++) {
        let gridCoord = [currentChunkGridX + xOffset, 0.0, currentChunkGridZ + zOffset];
        if (this.terrainChunkDict.hasOwnProperty(gridCoord)) {
          this.terrainChunkDict[gridCoord].updateTerrain();
        } else {
          this.terrainChunkDict[gridCoord] = new Terrain(this.mapSize, this.chunkScale, gridCoord, this.lodInfo);
        }
        if (this.terrainChunkDict[gridCoord].visible) {
          this.updateMesh(this.terrainChunkDict[gridCoord].terrainMesh);
          let numOfVertices = this.terrainChunkDict[gridCoord].terrainMesh.vertices.length;
          if (!this.visibleTerrainDict.hasOwnProperty(numOfVertices))
          {
            this.visibleTerrainDict[numOfVertices] = [];
          }
          this.visibleTerrainDict[numOfVertices].push(this.terrainChunkDict[gridCoord].terrainMesh);
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
    for (let i = 0; i < levelOfDetail.length; i ++) {
      let terrainMesh = new Mesh(terrainMapSize, i);
      terrainMesh.translate(this.meshPosition[0], this.meshPosition[1], this.meshPosition[2]);
      terrainMesh.scale(this.terrainScale);
      this.lodMeshes.push(terrainMesh);
    }
    this.updateTerrain();
  }

  calcViewDistance() {
    //Calculate the distance from camera position to the bound (simplified as a circle) of terrain mesh
    let r = Math.sqrt(2.0 * Math.pow(this.terrainSize * this.terrainScale * 0.5, 2));
    return camera.getViewDistanceXZ(this.meshPosition) - r;
  }

  updateTerrain() {
    let distance = this.calcViewDistance();
    let maxViewDistance = this.lodDetails[this.lodDetails.length - 1];
    this.visible = (distance <= maxViewDistance);
    if (this.visible) {
      let lodIdx = 0;
      for (let i = 0; i < this.lodDetails.length - 1; i ++) {
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
