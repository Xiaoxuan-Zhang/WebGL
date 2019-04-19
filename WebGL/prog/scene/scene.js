/**
 * Specifies a WebGL scene.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Scene}
 */
var Scene = function() {
  this.geometries = []; // Geometries being drawn on canvas
  this.sceneObjects = []; //Objects being added to scene
}

Scene.prototype.init = function() {
  this.clearGeometry();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  camera = new Camera();
  light = new Light();
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
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  this.sceneObjects.forEach(function(object) {
    object.render();
  });

  this.geometries.forEach(function(geometry){
    if (geometry.visible) {
      geometry.render();
    }
  })
  // let duration = Math.round(performance.now() - start);
  // g_guiInfo.fps = 1000/duration;
}

/**
* For debug
*/
function addObjects() {
  //addCat();
  //addTeapot();
  //addFloor();
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
  geo.scale(0.7);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}
function addTeapot() {
  let geo = new CustomObject(g_object["teapot"]);
  geo.translate(0.0, 5.0, 0.0);
  geo.rotate(90, [0, 1, 0]);
  geo.scale(5.0);
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
  geo.scale(20);
  geo.rotate(90, [1, 0, 0]);
  let uniforms = {
    u_sample: {type: "texture", value: g_texture["wood"]["diffuse"]}
  };
  let material = new Material(uniforms, g_programs["Texture"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addEarth() {
  let geo = new CustomObject(g_object["earth"]);
  geo.translate(-0.4, 1.0, 0.0);
  geo.rotate(90, [0, 1, 0]);
  geo.scale(0.001);
  let uniforms = {
    //u_sample: {type: "texture", value: g_texture["earth"]["diffuse"]},
    u_objectColor: {type: "v3", value: [0.7, 0.5, 0.5]}
  }
  let material = new Material(uniforms, g_programs["BasicLights"])
  geo.addMaterial(material);
  scene.addGeometry(geo);
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
