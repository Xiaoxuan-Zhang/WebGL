/**
 * Specifies a PCG terrain.
 *
 * @author "Xiaoxuan Zhang"
 * @this {PCGTerrain}
 */
var PCGTerrain = function(mapSize, mapScale, lodInfo) {
  //map size is equal to the number of vertices, so the actural size of terrain chunk should be (mapSize-1).
  this.chunkSize = mapSize - 1;
  this.chunkScale = mapScale;
  this.mapSize = mapSize;
  this.LODMeshInfo = this.setLOD(lodInfo, mapSize);
  this.maxViewDistance = lodInfo[lodInfo.length - 1];
  this.numOfChunksInView = Math.round(this.maxViewDistance / (this.chunkSize * this.chunkScale));
  this.terrainChunkDict= {};
  this.visibleTerrainDict= {};
  this.viewUpdateStep = 5.0;
  this.bufferDataUpdated = {};
  this.lastViewPos = Object.assign({}, camera.position);
  let uniforms = {
    //u_sample: {type: "texture", value: g_texture['snow']['normal']},
    u_displacement: {type: "f", value: g_terrain.displacement},
    u_terrain: {type: "v3", value: [g_terrain.water, g_terrain.earth, g_terrain.snow]},
    u_noise: {type: "v3", value: [g_terrain.persistance, g_terrain.lacunarity, g_terrain.exponent]},
    u_clip: {type:"v2", value: g_terrain.clip},
    u_mouse: {type:"v2", value: [g_mousePos[0], -g_mousePos[1]]},
    u_time: {type:"f", value: performance.now()}
  }
  this.material = new Material(uniforms, g_programs["Terrain2"]);
  this.init();
  this.updateTerrain();
}

/*Pre-render operations*/
PCGTerrain.prototype.init = function() {
  for (let i = 0; i < this.LODMeshInfo.lodMeshes.length; i ++) {
    this.bufferDataUpdated['Vertice_' + this.LODMeshInfo.lodMeshes[i].vertices.length] = {buffer: createBufferData(this.LODMeshInfo.lodMeshes[i].vertices), dataCount: 3, binded: true};
    this.bufferDataUpdated['UV_' + this.LODMeshInfo.lodMeshes[i].UVs.length] = {buffer: createBufferData(this.LODMeshInfo.lodMeshes[i].UVs), dataCount: 2, binded: true};
    this.bufferDataUpdated['Normal_' + this.LODMeshInfo.lodMeshes[i].normals.length] = {buffer: createBufferData(this.LODMeshInfo.lodMeshes[i].normals), dataCount: 3, binded: true};
  }
}

PCGTerrain.prototype.render = function() {

  // Tranform and draw call for each visible terrain mesh
  useShader(gl, this.material.shader);
  light.sendUniforms();
  camera.sendUniforms();
  this.sendUniforms();

  for (let key in this.visibleTerrainDict) {
    let terrainList = this.visibleTerrainDict[key];
    for (let i = 0; i < terrainList.length; i++) {
      if (i == 0) {
        let bufferData = this.bufferDataUpdated['Vertice_' + terrainList[i].terrainMesh.vertices.length];
        sendAttributeBufferToGLSL(bufferData.buffer, bufferData.dataCount, "a_position");
        bufferData = this.bufferDataUpdated['Normal_' + terrainList[i].terrainMesh.normals.length];
        sendAttributeBufferToGLSL(bufferData.buffer, bufferData.dataCount, "a_normal");
        bufferData = this.bufferDataUpdated['UV_' + terrainList[i].terrainMesh.UVs.length];
        sendAttributeBufferToGLSL(bufferData.buffer, bufferData.dataCount, "a_texCoord");
      }
      sendUniformMat4ToGLSL(terrainList[i].modelMatrix, "u_model");
      terrainList[i].normalMatrix.setInverseOf(terrainList[i].modelMatrix);
      terrainList[i].normalMatrix.transpose();
      sendUniformMat4ToGLSL(terrainList[i].normalMatrix, 'u_normalMatrix');
      tellGLSLToDrawArrays(terrainList[i].terrainMesh.vertices.length/3);
    }
  }
}

PCGTerrain.prototype.sendUniforms = function() {
  //update the latest parameters from GUI
  this.material.uniforms.u_displacement.value = g_terrain.displacement;
  this.material.uniforms.u_terrain.value = [g_terrain.earth, g_terrain.snowAmount, g_terrain.snowBlur];
  this.material.uniforms.u_noise.value = [g_terrain.persistance, g_terrain.lacunarity, g_terrain.exponent];
  this.material.uniforms.u_time.value = performance.now() * 0.001;
  this.material.uniforms.u_clip.value = g_terrain.clip;
  this.material.uniforms.u_mouse.value = g_terrain.updateMouse? [g_mousePos[0], -g_mousePos[1]] : [0.0, 0.0];
  this.material.sendUniformToGLSL();
}

PCGTerrain.prototype.updateAnimation = function() {
  let distance = camera.getViewDistanceXZ(this.lastViewPos);
  if (distance > this.viewUpdateStep) {
    this.updateTerrain();
    this.lastViewPos = Object.assign({}, camera.position);
  }
}

PCGTerrain.prototype.updateTerrain = function() {
  this.visibleTerrainDict = {};
  let currentChunkGridX = Math.round(camera.position[0] / (this.chunkSize * this.chunkScale));
  let currentChunkGridZ = Math.round(camera.position[2] / (this.chunkSize * this.chunkScale));
  for (let zOffset = -this.numOfChunksInView; zOffset <= this.numOfChunksInView; zOffset++) {
    for (let xOffset = -this.numOfChunksInView; xOffset <= this.numOfChunksInView; xOffset++) {
      let gridCoord = [currentChunkGridX + xOffset, 0.0, currentChunkGridZ + zOffset];
      if (this.terrainChunkDict.hasOwnProperty(gridCoord)) {
        this.terrainChunkDict[gridCoord].updateLOD();
      } else {
        let terrainPos = [gridCoord[0] * this.chunkSize * this.chunkScale, gridCoord[1] * this.chunkSize * this.chunkScale, gridCoord[2] * this.chunkSize * this.chunkScale];
        this.terrainChunkDict[gridCoord] = new Terrain(this.chunkSize, this.chunkScale, terrainPos, this.LODMeshInfo);
      }
      if (this.terrainChunkDict[gridCoord].visible) {
        this.terrainChunkDict[gridCoord].updateTransform();
        let numOfVertices = this.terrainChunkDict[gridCoord].terrainMesh.vertices.length;
        if (!this.visibleTerrainDict.hasOwnProperty(numOfVertices))
        {
          this.visibleTerrainDict[numOfVertices] = [];
        }
        this.visibleTerrainDict[numOfVertices].push(this.terrainChunkDict[gridCoord]);
      }
    }
  }
}

PCGTerrain.prototype.setLOD = function(levelOfDetail, terrainMapSize) {
  let LODMeshInfo = {lodLevels: [], lodMeshes: []};
  LODMeshInfo.lodLevels = levelOfDetail;
  for (let i = 0; i < levelOfDetail.length; i ++) {
    LODMeshInfo.lodMeshes.push(new Mesh(terrainMapSize, i));
  }
  return LODMeshInfo;
}

var Terrain = function(terrainSize, terrainScale, position, lodMeshInfo) {
  this.terrainScale = terrainScale;
  this.terrainSize = terrainSize;
  this.meshPosition = position;
  this.terrainMesh = null;
  this.lodMeshInfo = lodMeshInfo;
  this.lastLodIndex = -1;
  this.modelMatrix = new Matrix4(); // Model matrix applied to geometric object
  this.normalMatrix = new Matrix4();
  this.translateValue = [0.0, 0.0, 0.0];
  this.scaleValue = 1.0;
  this.rotation = 0.0;
  this.rotationAxis = [0, 0, 1];
  this.visible = false;

  this.translate(this.meshPosition[0], this.meshPosition[1], this.meshPosition[2]);
  this.scale(this.terrainScale);
  this.updateLOD();
}

Terrain.prototype.translate = function(x, y, z) {
  this.translateValue[0] = x;
  this.translateValue[1] = y;
  this.translateValue[2] = z;
}

Terrain.prototype.scale = function(scale) {
  this.scaleValue = scale;
}

Terrain.prototype.rotate = function(degree, axis) {
  this.rotation = degree;
  this.rotationAxis = axis;
}

Terrain.prototype.updateTransform = function() {
  this.modelMatrix.setTranslate(this.translateValue[0], this.translateValue[1], this.translateValue[2]);
  this.modelMatrix.scale(this.scaleValue, this.scaleValue, this.scaleValue);
}

Terrain.prototype.calcViewDistance = function() {
  //Calculate the distance from camera position to the bound (simplified as a circle) of terrain mesh
  let r = Math.sqrt(2.0 * Math.pow(this.terrainSize * this.terrainScale * 0.5, 2));
  return camera.getViewDistanceXZ(this.meshPosition) - r;
}

Terrain.prototype.updateLOD = function() {
  let distance = this.calcViewDistance();
  let maxViewDistance = this.lodMeshInfo.lodLevels[this.lodMeshInfo.lodLevels.length - 1];
  this.visible = (distance <= maxViewDistance);
  if (this.visible) {
    let lodIdx = 0;
    for (let i = 0; i < this.lodMeshInfo.lodLevels.length - 1; i ++) {
      if (distance > this.lodMeshInfo.lodLevels[i]) {
        lodIdx = i + 1;
      } else {
        break;
      }
    }
    if (this.lastLodIndex != lodIdx) {
      this.terrainMesh = this.lodMeshInfo.lodMeshes[lodIdx];
      this.lastLodIndex = lodIdx;
    }
  }
}
