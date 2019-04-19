/**
* Function called when the webpage loads.
*/
var canvas;
var gl;
var scene, camera, light;
var g_programs = {};
var g_texture = {};
var g_object = {};
var g_totalObjects = 0;
var g_loadedObjects = 0;
var g_loaded = false;
var g_mousePos = [0.0, 0.0];
/**
Globals for terrain
*/
var g_terrain = {
  scale: 1,
  mapSize: 257, //must be (2^n + 1)
  displacement: 15.0,
  water: 0.4,
  earth: 0.4,
  snow: 0.8,
  persistance: 0.4,
  lacunarity: 2.0,
  exponent: 2.5,
  updateMouse: false
};
/**
Globals for GUI
*/
var g_guiInfo = {
  scene: 'Loading...',
  control: 'WSAD to move, IKJL to rotate'
}


function main() {
  // document.getElementById('displacement-value').value = g_terrain['displacement'];
  // document.getElementById('sealevel-value').value = g_terrain['seaLevel'];
  // document.getElementById('headline').innerHTML = 'Main scene: Loading...'

  canvas = document.getElementById('my-canvas');
  if (!canvas)
  {
    console.log('Fail to retrieve canvas element');
    return false;
  }
  gl = getWebGLContext(canvas, false);
  if (!gl)
  {
    console.log('Failed to get the webgl context');
    return;
  }
  resizeCanvas();
  gl.enable(gl.DEPTH_TEST);
  //gl.enable(gl.CULL_FACE);
  addShaderPrograms();
  loadObjects();
  loadTextures();

  scene = new Scene();
  //Register events
  initEventHandelers(canvas);
  tick();

  setupGUI();

}


function addShaderPrograms()
{
  createShaderProgram('BasicLights', BASICLIGHTS_VSHADER1, BASICLIGHTS_FSHADER1);
  createShaderProgram('Texture', TEX_VSHADER1, TEX_FSHADER1);
  createShaderProgram('Custom', CUSTOM_VSHADER1, CUSTOM_FSHADER1);
  createShaderProgram('Terrain', TERRAIN_VSHADER1, TERRAIN_FSHADER1);
}

function loadTextures() {
  //loadTextureFile('external/textures/wood.png', 'wood', 'diffuse');
  loadTextureFile('external/textures/TeapotTex.png', 'teapot', 'diffuse');
  //loadTextureFile('external/OBJ/h5uo4n0v569s-earth/4096_earth.jpg', 'earth', 'diffuse');
  //loadTextureFile('external/OBJ/Cat-1/Cat_D.PNG', 'cat', 'diffuse');
  //loadTextureFile('external/OBJ/Cat-1/Cat_S.PNG', 'cat', 'specular');
  //loadTextureFile('external/OBJ/Cat-1/Cat_N.PNG', 'cat', 'normal');
  loadTextureFile('external/textures/turbulence_bw.png', 'heightMap', 'diffuse');
}

function loadObjects () {
  loadObjectFile('external/OBJ/teapot.obj', 'teapot');
  //loadObjectFile('external/OBJ/Cat-1/cat.obj', 'cat');
  //loadObjectFile('external/OBJ/h5uo4n0v569s-earth/earth.obj', 'earth');
  //loadObjectFile('external/OBJ/jaguar.obj', 'jaguar');
}

/*File uploading*/
function createTask() {
  g_totalObjects += 1;
}

function finishTask() {
  g_loadedObjects += 1;
}

function textureLoadedCallback(name, type, textureObj) {
  if (!(name in g_texture)) {
    g_texture[name] = {};
  }
  g_texture[name][type] = textureObj;
  finishTask();
}

function loadTextureFile(path, name, type) {
  createTask();
  create2DTexture(path, gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT, function(texture) {textureLoadedCallback(name, type, texture)});
}

function objectFileLoadedCallback(name, textObj)
{
  let init_obj = new LoadedOBJ(textObj);
  g_object[name] = init_obj;
  finishTask();
}

function loadObjectFile(path, name) {
  createTask();
  loadFile(path, function(text) {objectFileLoadedCallback(name, text)});
}

/**
 * create shader program
 *
 * @public
 * @param {String} programName name of a shader program
 * @param {String} vertexShader text data of vertex shader
 * @param {String} fragShader text data of fragment shader
 */
function createShaderProgram(programName, vertexShader, fragShader) {
  let program = createShader(gl, vertexShader, fragShader);
  if (!program)
  {
    console.log('Failed to create shaders');
    return;
  }
  g_programs[programName] = program;
}

function setupGUI() {
  gui = new dat.GUI();

  let terrain = gui.addFolder('Terrain');
  terrain.add(g_terrain, 'displacement', 0.0, 100.0).listen();
  terrain.add(g_terrain, 'water', 0.0, 2.0).listen();
  terrain.add(g_terrain, 'snow', 0.0, 3.0).listen();
  terrain.add(g_terrain, 'persistance', 0.0, 1.0).listen();
  terrain.add(g_terrain, 'lacunarity', 1.0, 3.0).listen();
  terrain.add(g_terrain, 'exponent', 0.0, 4.0).listen();
  terrain.add(g_terrain, 'updateMouse');
  terrain.open();

  let info = gui.addFolder('Info');
  info.add(g_guiInfo, 'scene').listen();
  info.add(g_guiInfo, 'control');
  info.open();
}
