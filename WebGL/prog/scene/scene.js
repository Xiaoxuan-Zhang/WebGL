/**
 * Specifies a WebGL scene.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Scene}
 */
class Scene {
  /**
   * Constructor for Scene.
   *
   * @constructor
   */
  constructor() {
    this.geometries = []; // Geometries being drawn on canvas
    this.sceneObjects = []; //Objects being added to scene
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  init() {
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
  addSceneObject(object) {
    this.sceneObjects.push(object);
  }

  /**
   * Adds the given geometry to the scene.
   *
   * @param {Geometry} geometry Geometry being added to scene
   */
  addGeometry(geometry) {
    this.geometries.push(geometry);
  }

  /**
   * Clears all the geometry within the scene.
   */
  clearGeometry() {
    // Recommendations: It would be best to call this.render() at the end of
    // this call.
    this.geometries = [];
    this.render();
  }

  /**
   * Updates the animation for each geometry in geometries.
   */
  updateAnimation() {
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
  render() {
    var start = performance.now();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.sceneObjects.forEach(function(object) {
      object.render();
    });
    this.geometries.forEach(function(geometry){
      if (geometry.visible) {
        geometry.render();
      }
    })
    var duration = Math.round(performance.now() - start);
    sendTextToHTML(Math.round(1000/duration), 'fps');
  }
}

/**
* For debug
*/
function addObjects() {
  //addCat();
  //addTeapot();
  //addFloor();
  //addEarth();
  //addTerrain();
  addPCGTerrain();

}
function addCat() {
  var geo = new CustomObject(g_object["cat"]);
  var uniforms = {
    u_sample: {type: "texture", value: g_texture["cat"]["diffuse"]},
    v_objectColor: {type: 'v3', value: [0.7, 0.5, 0.5]}
  };
  var material = new Material(uniforms, g_programs['Texture']);
  geo.translate(0.2, 0.0, 0.0);
  geo.scale(0.7);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}
function addTeapot() {
  var geo = new CustomObject(g_object["teapot"]);
  geo.translate(0.0, 0.0, 0.0);
  geo.rotate(90, [0, 1, 0]);
  geo.scale(0.3);
  var uniforms = {
    //u_sample: {type: "texture", value: g_texture["teapot"]["diffuse"]}
    u_objectColor: {type: "v3", value: [0.7, 0.7, 1.0]}
  }
  var material = new Material(uniforms, g_programs["BasicLights"])
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addFloor() {
  var geo = new Square();
  geo.scale(20);
  geo.rotate(90, [1, 0, 0]);
  var uniforms = {
    u_sample: {type: "texture", value: g_texture["wood"]["diffuse"]}
  };
  var material = new Material(uniforms, g_programs["Texture"]);
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addEarth() {
  var geo = new CustomObject(g_object["earth"]);
  geo.translate(-0.4, 1.0, 0.0);
  geo.rotate(90, [0, 1, 0]);
  geo.scale(0.001);
  var uniforms = {
    //u_sample: {type: "texture", value: g_texture["earth"]["diffuse"]},
    u_objectColor: {type: "v3", value: [0.7, 0.5, 0.5]}
  }
  var material = new Material(uniforms, g_programs["BasicLights"])
  geo.addMaterial(material);
  scene.addGeometry(geo);
}

function addTerrain() {
  var terrainMesh = new Mesh(TERRAIN_MAP_SIZE, 1);
  terrainMesh.scale(TERRAIN_SCALE);
  var uniforms = {
    u_sample: {type: "texture", value: g_texture["heightMap"]["diffuse"]},
    u_displacement: {type: "f", value: g_terrain['displacement']},
    u_seaLevel: {type: "f", value: g_terrain['seaLevel']}
  }
  var material = new Material(uniforms, g_programs["Terrain"])
  terrainMesh.addMaterial(material);
  scene.addGeometry(terrainMesh);
}

function addPCGTerrain() {
  var dynamicTerrain = new PCGTerrain(TERRAIN_MAP_SIZE, TERRAIN_SCALE, setLodInfo());
  scene.addSceneObject(dynamicTerrain);
}

/* LOD details: LOD, viewDistance */
function setLodInfo() {
  var lodInfo = [];
  lodInfo.push(50);
  lodInfo.push(150);
  //lodInfo.push(400);
  return lodInfo;
}
