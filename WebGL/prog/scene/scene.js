/**
 * Specifies a WebGL scene.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Scene}
 */
var Scene = function() {
  this.geometries = []; // Geometries being drawn on canvas
  this.sceneObjects = []; //Objects being added to scene
  this.skybox = null;
  this.final = null;
}

Scene.prototype.init = function() {
  this.skybox = null;
  this.clearGeometry();
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
}

/**
 * Adds the given object to the scene.
 *
 * @param {Object} object object being added to scene
 */
Scene.prototype.addSceneObject = function(object) {
  this.sceneObjects.push(object);
}

/**
 * Adds the given geometry to the scene.
 *
 * @param {Geometry} geometry Geometry being added to scene
 */
Scene.prototype.addGeometry = function(geometry) {
  this.geometries.push(geometry);
}

  /**
   * Clears all the geometry within the scene.
   */
Scene.prototype.clearGeometry = function() {
  // Recommendations: It would be best to call this.render() at the end of
  // this call.
  this.geometries = [];
  this.sceneObjects = [];
  this.render();
}

  /**
   * Updates the animation for each geometry in geometries.
   */
Scene.prototype.updateAnimation = function() {
  // Recomendations: No rendering should be done here. Your Geometry objects
  // in this.geometries should update their animations themselves through
  // their own .updateAnimation() methods.
  this.sceneObjects.forEach(function(object) {
    object.updateAnimation();
  });
  this.geometries.forEach(function(geometry){
    if (geometry.visible) {
      geometry.updateAnimation();
    }
  });
}

/**
 * Renders all the Geometry within the scene.
 */
Scene.prototype.render = function() {
  //let start = performance.now();
  //first pass : render to framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, g_frameBuffer['first']);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.frontFace(gl.CW);
  g_terrain.clip = [-100.0, 100.0];
  this.sceneObjects.forEach(function(object) {
    object.render();
  });
  gl.frontFace(gl.CCW);

  this.geometries.forEach(function(geometry){
    if (geometry.visible) {
      geometry.render();
    }
  });
  gl.flush();


  if (this.skybox != null) {
    gl.disable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    this.skybox.render();
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
  }

  //Second pass : render to scene
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (this.final != null) {
    this.final.render();
  }
  // let duration = Math.round(performance.now() - start);
  // g_guiInfo.fps = 1000/duration;
}

/**
* For debug
*/
function addObjects() {
  addFinalQuad();
  addPCGSky();
  //addSkybox();
  //addCat();
  //addFloor();
  //addCube();

  addPCGTerrain();

}

function addCat() {
  let geo = new CustomObject(g_object["cat"]);
  let uniforms = {
    u_model: {type: "mat4", value: geo.modelMatrix},
    u_view: {type: "mat4", value: camera.viewMatrix},
    u_projection: {type: "mat4", value: camera.projectionMatrix},
    u_normalMatrix: {type: "mat4", value: geo.normalMatrix},
    u_cameraPos: {type: 'v3', value: camera.position},
    u_sample: {type: "texture", value: g_texture["cat"]["diffuse"]},
    u_specular: {type: "texture", value: g_texture["cat"]["specular"]},
    u_normal: {type: "texture", value: g_texture["cat"]["normal"]},
  };
  let material = new Material(uniforms, g_programs['BasicLights']);
  geo.translate(0.0, 2.0, -5.0);
  geo.scale([3.0, 3.0, 3.0]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addFloor() {
  let geo = new Square();
  geo.translate(0.0, 0.0, 0.0);
  geo.scale([20.0, 20.0, 20.0]);
  geo.rotate(-90, [1, 0, 0]);
  let uniforms = {
    u_model: {type: "mat4", value: geo.modelMatrix},
    u_view: {type: "mat4", value: camera.viewMatrix},
    u_projection: {type: "mat4", value: camera.projectionMatrix},
    u_sample: {type: "texture", value: g_texture['wood']['diffuse']}
    //u_depth: {type: "texture", value: g_texture['framebuffer']['depth']},
  };
  let material = new Material(uniforms, g_programs["Texture"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addCube() {
  let geo = new Cube();
  geo.translate(0.0, 0.0, 0.0);
  geo.scale([2.0, 2.0, 2.0]);
  let uniforms = {
    u_model: {type: "mat4", value: geo.modelMatrix},
    u_view: {type: "mat4", value: camera.viewMatrix},
    u_projection: {type: "mat4", value: camera.projectionMatrix},
    u_cubemap : {type: "cubemap", value: g_texture['skybox']['skybox']}
  }
  let material = new Material(uniforms, g_programs["Cubemap"])
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addFinalQuad() {
  let geo = new Square();
  let uniforms = {
    u_sample: {type: "texture", value: g_texture['framebuffer']['color']},
    u_depth: {type: "texture", value: g_texture['framebuffer']['depth']},
  };
  let material = new Material(uniforms, g_programs["Final"]);
  geo.addMaterial(material);
  scene.final = geo;
}

function addSkybox() {
  var geo = new Cube();
  var uniforms = {
    //u_model: {type: "mat4", value: geo.modelMatrix},
    u_view: {type: "mat4", value: camera.viewMatrix},
    u_projection: {type: "mat4", value: camera.projectionMatrix},
    u_cubemap : {type: "cubemap", value: g_texture['skybox']['skybox']}
  };
  var material = new Material(uniforms, g_programs["Skybox"]);
  geo.addMaterial(material);
  scene.skybox = geo;
}

function addPCGSky() {
  var geo = new Square();
  var uniforms = {
    u_viewProjectInvMatrix: {type: "mat4", value: camera.viewProjectionInvMatrix},
    u_cubemap: {type: "cubemap", value: g_texture['skybox']['skybox']},
    u_time: {type: "t", value: 0.0}
  };
  var material = new Material(uniforms, g_programs["PCGSky"]);

  geo.addMaterial(material);
  scene.skybox = geo;
}

function addPCGTerrain() {
  scene.addSceneObject(new PCGTerrain(g_terrain['mapSize'], g_terrain['scale'], setLodInfo()));
}

/* LOD details: LOD, viewDistance */
function setLodInfo() {
  let lodInfo = [];
  lodInfo.push(200);
  lodInfo.push(400);
  lodInfo.push(600);
  lodInfo.push(800);
  return lodInfo;
}
