/**
 * Specifies a WebGL scene.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Scene}
 */
var Scene = function() {
  this.geometries = []; // Geometries being drawn on canvas
  this.sceneObjects = []; //Objects being added to scene
  this.background = null;
}

Scene.prototype.init = function() {
  this.background = null;
  this.clearGeometry();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
  if (this.background != null) {
    this.background.material.uniforms.u_time.value = performance.now() * 0.001;
    this.background.material.uniforms.u_mouse.value = g_terrain.updateMouse? [g_mousePos[0], -g_mousePos[1]] : [0.0, 0.0];;
  }
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
  //Render to framebuffer

  //first pass
  //draw background
  gl.bindFramebuffer(gl.FRAMEBUFFER, g_frameBuffer['first']);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (this.background != null) {
    this.background.render();
    gl.flush();
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CW);
  g_terrain.clip = [-100.0, 100.0];
  this.sceneObjects.forEach(function(object) {
    object.render();
  });
  gl.flush();

  //second pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, g_frameBuffer['second']);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CW);
  g_terrain.clip = [0.0, 100.0];
  camera.position[1] *= -1.0 ;
  camera.pitch *= -1.0;
  this.sceneObjects.forEach(function(object) {
    object.render();
  });
  gl.flush();

  //third pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, g_frameBuffer['third']);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CW);
  g_terrain.clip = [-100.0, 0.0];
  camera.position[1] *= -1.0;
  camera.pitch *= -1.0;
  this.sceneObjects.forEach(function(object) {
    object.render();
  });
  gl.flush();

  //render to scene
  // Tell WebGL how to convert from clip space to pixels
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //g_terrain.clip = -5.0;
  this.geometries.forEach(function(geometry){
    if (geometry.visible) {
      geometry.render();
    }
  });

  // let duration = Math.round(performance.now() - start);
  // g_guiInfo.fps = 1000/duration;
}

/**
* For debug
*/
function addObjects() {
  addBackgroundQuad();
  //addCat();
  //addTeapot();
  //addFloor();
  addFinalQuad();
  addReflectQuad();
  addRefractQuad();

  //addEarth();
  addPCGTerrain();

}
function addCat() {
  let geo = new CustomObject(g_object["cat"]);
  let uniforms = {
    u_sample: {type: "texture", value: g_texture["cat"]["diffuse"]},
    v_objectColor: {type: 'v3', value: [0.7, 0.5, 0.5]}
  };
  let material = new Material(uniforms, g_programs['Texture']);
  geo.translate(0.2, 0.0, 0.0);
  geo.scale([0.7, 0.7, 1.0]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}
function addTeapot() {
  let geo = new CustomObject(g_object["teapot"]);
  geo.translate(0.0, 5.0, 0.0);
  geo.rotate(90, [0, 1, 0]);
  geo.scale([5.0, 5.0, 1.0]);
  let uniforms = {
    u_sample: {type: "texture", value: g_texture["teapot"]["diffuse"]},
    u_objectColor: {type: "v3", value: [0.7, 0.7, 1.0]}
  }
  let material = new Material(uniforms, g_programs["BasicLights"])
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addFloor() {
  let geo = new Square();
  geo.translate(0.0, 10.0, -100.0);
  geo.scale([20.0, 20.0, 1.0]);
  //geo.rotate(90, [1, 0, 0]);
  let uniforms = {
    u_sample: {type: "texture", value: g_texture['wood']['diffuse']}
    //u_depth: {type: "texture", value: g_texture['framebuffer']['depth']},
  };
  let material = new Material(uniforms, g_programs["Texture"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addEarth() {
  let geo = new CustomObject(g_object["earth"]);
  geo.translate(-0.4, 1.0, 0.0);
  geo.rotate(90, [0, 1, 0]);
  geo.scale([0.001, 0.001, 0.001]);
  let uniforms = {
    //u_sample: {type: "texture", value: g_texture["earth"]["diffuse"]},
    u_objectColor: {type: "v3", value: [0.7, 0.5, 0.5]}
  }
  let material = new Material(uniforms, g_programs["BasicLights"])
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addReflectQuad() {
  let geo = new Square();
  geo.translate(-0.8, 0.8, 0.0);
  geo.scale([0.2, 0.2, 1.0]);
  let uniforms = {
    u_sample: {type: "texture", value: g_texture['framebuffer']['reflect']}
  };
  let material = new Material(uniforms, g_programs["Custom"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addRefractQuad() {
  let geo = new Square();
  geo.translate(-0.8, 0.4, 0.0);
  geo.scale([0.2, 0.2, 1.0]);
  let uniforms = {
    u_sample: {type: "texture", value: g_texture['framebuffer']['refract']}
  };
  let material = new Material(uniforms, g_programs["Custom"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addFinalQuad() {
  let geo = new Square();
  let uniforms = {
    u_sample: {type: "texture", value: g_texture['framebuffer']['color']},
    u_reflect: {type: "texture", value: g_texture['framebuffer']['reflect']},
    u_refract: {type: "texture", value: g_texture['framebuffer']['refract']}
    //u_depth: {type: "texture", value: g_texture['framebuffer']['depth']},
  };
  let material = new Material(uniforms, g_programs["Final"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addBackgroundQuad() {
  let geo = new Square();
  let uniforms = {
    u_sample: {type: "texture", value: g_texture['wood']['diffuse']},
    u_time: {type: "f", value: performance.now()},
    u_mouse: {type: "v2", value: g_mousePos}
  };
  let material = new Material(uniforms, g_programs["Background"]);
  geo.addMaterial(material);
  scene.background = geo;
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
