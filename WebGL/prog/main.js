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
var g_frameBuffer = {};
var lastTime = 0.0;
var deltaTime = 0.0;
/**
Globals for Terrain
*/
var g_terrain = {
  scale: 1,
  mapSize: 257, //must be (2^n + 1)
  noiseScale:100.0,
  displacement: 42.0,
  earth: -0.5,
  snowBlur: 0.5,
  snowAmount: 0.2,
  persistance: 0.43,
  lacunarity: 2.0,
  exponent: 2.5,
  clip: [-100.0, 100.0],
  fogAmount: 1.5,
  fogColor: [ 238, 222, 242 ],
  updateMouse: false
};
/**
Globals for Particles
*/
var g_particles = {
  enable: false,
  amount: 8000,
  birthRate: 0.15,
  minAge: 10.0,
  maxAge: 30.0,
  minTheta: -180.0,
  maxTheta: 180.0,
  minSpeed: 0.32,
  maxSpeed: 1.0,
  force: 70.0,
  gravity: -8.0,
  scale: 1.0
}
/**
Globals for GUI
*/
var g_guiInfo = {
  scene: 'Loading...',
  control: 'WSAD to move, IKJL to rotate'
}
/**
* Function called when the webpage loads.
*/
function main() {
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
  //gl.getExtension("OES_texture_float");
  //gl.getExtension("OES_texture_float_linear");
  //gl.getExtension( "WEBGL_depth_texture");
  //gl.getExtension( "MOZ_WEBGL_depth_texture" );
  //gl.getExtension( "WEBKIT_WEBGL_depth_texture" );
  resizeCanvas();
  addShaderPrograms();
  loadObjects();
  loadTextures();
  RenderToTexture('Color');

  scene = new Scene();
  camera = new Camera();
  light = new Light();

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
  createShaderProgram('Terrain2', TERRAIN_VSHADER2, TERRAIN_FSHADER2);
  createShaderProgram('Final', FINAL_VSHADER, FINAL_FSHADER);
  createShaderProgram('Cubemap', CUBEMAP_VSHADER, CUBEMAP_FSHADER);
  createShaderProgram('Skybox', SKYBOX_VSHADER, SKYBOX_FSHADER);
  createShaderProgram('PCGSky', SKYBOXQUAD_VSHADER, SKYBOXQUAD_FSHADER);
}

function loadTextures() {
  loadTextureFile('external/textures/wood.png', 'wood', 'diffuse');
  //loadTextureFile('external/textures/SnowLightCoverB_N.jpg', 'snow', 'normal');
  loadCubemapTextureFiles('external/textures/Yokohama3', 'jpg', 'skybox', 'skybox');
  //loadTextureFile('external/OBJ/h5uo4n0v569s-earth/4096_earth.jpg', 'earth', 'diffuse');
  // loadTextureFile('external/OBJ/Cat-1/Cat_D.PNG', 'cat', 'diffuse');
  // loadTextureFile('external/OBJ/Cat-1/Cat_S.PNG', 'cat', 'specular');
  // loadTextureFile('external/OBJ/Cat-1/Cat_N.PNG', 'cat', 'normal');
  //loadTextureFile('external/textures/turbulence_bw.png', 'heightMap', 'diffuse');
  loadTextureFile('external/textures/noise64.png', 'noise', 'noise64');
  loadTextureFile('external/textures/noise.png', 'noise', 'noise512');
  loadTextureFile('external/textures/turbulence.png', 'noise', 'turbulence');
  loadTextureFile('external/textures/dot.png', 'dot', 'dot');
}

function loadObjects () {
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

function addTexture(name, type, texObj) {
  if (!(name in g_texture)) {
    g_texture[name] = {};
  }
  g_texture[name][type] = texObj;
}

function textureLoadedCallback(name, type, textureObj) {
  addTexture(name, type, textureObj);
  finishTask();
}

function loadTextureFile(path, name, type) {
  createTask();
  create2DTexture(path, gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT, function(texture) {textureLoadedCallback(name, type, texture)});
}

function loadCubemapTextureFiles(path, imageFormat, name, type) {
  for (let i = 0; i < 6; ++i) {
    createTask();
  }
  createCubemapTexture(path, imageFormat, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, function(texture) {textureLoadedCallback(name, type, texture)});
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

function RenderToTexture(type) {
  // Create and bind the framebuffer
  let fb0 = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
  g_frameBuffer['first'] = fb0;

  let colorTexture = createNullTexture(gl.canvas.width, gl.canvas.height, gl.RGBA, gl.RGBA, 0, gl.UNSIGNED_BYTE, gl.NEAREST, gl.NEAREST, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
  addTexture('framebuffer', 'color', colorTexture);
  let depthTexture = createNullTexture(gl.canvas.width, gl.canvas.height, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, 0, gl.UNSIGNED_INT, gl.NEAREST, gl.NEAREST, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
  addTexture('framebuffer', 'depth', depthTexture);
  // set the texture as the first color attachment
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  // set the texture as the depth attachment
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function updateRenderTexture(width, height) {
  if (g_texture['framebuffer']) {
    updateNullTexture(g_texture['framebuffer']['color'], gl.canvas.width, gl.canvas.height, gl.RGBA, gl.RGBA, 0, gl.UNSIGNED_BYTE, gl.NEAREST, gl.NEAREST, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
    updateNullTexture(g_texture['framebuffer']['depth'], gl.canvas.width, gl.canvas.height, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, 0, gl.UNSIGNED_INT, gl.NEAREST, gl.NEAREST, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
  }
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
  terrain.add(g_terrain, 'noiseScale', 1.0, 500.0).listen();
  terrain.add(g_terrain, 'displacement', 0.0, 300.0).listen();
  //terrain.add(g_terrain, 'earth', -2.0, 2.0).listen();
  terrain.add(g_terrain, 'snowAmount', 0.0, 1.0).listen();
  terrain.add(g_terrain, 'snowBlur', 0.0, 1.0).listen();
  terrain.add(g_terrain, 'persistance', 0.0, 1.0).listen();
  terrain.add(g_terrain, 'lacunarity', 1.0, 5.0).listen();
  //terrain.add(g_terrain, 'exponent', 0.0, 4.0).listen();
  terrain.add(g_terrain, 'fogAmount', 0.01, 10.0, 0.05).listen();
  terrain.addColor(g_terrain, 'fogColor').listen();
  //terrain.add(g_terrain, 'clip', -5.0, 5.0).listen();
  //terrain.add(g_terrain, 'updateMouse');
  terrain.close();

  let particles = gui.addFolder('Particles');
  var particalController = particles.add(g_particles, 'enable').listen();
  particles.add(g_particles, 'amount', 0, 8000).listen();
  particles.add(g_particles, 'birthRate', 0.0, 1.0).listen();
  particles.add(g_particles, 'minAge', 0.0, 60.0).listen();
  particles.add(g_particles, 'maxAge', 0.0, 60.0).listen();
  particles.add(g_particles, 'minTheta', -360.0, 360.0, 1.0).listen();
  particles.add(g_particles, 'maxTheta', -360.0, 360.0, 1.0).listen();
  particles.add(g_particles, 'minSpeed', 0.0, 2.0, 0.01).listen();
  particles.add(g_particles, 'maxSpeed', 0.0, 2.0, 0.01).listen();
  particles.add(g_particles, 'force', 0.0, 100.0, 0.1).listen();
  particles.add(g_particles, 'gravity', -10.0, 10.0, 0.1).listen();
  particles.add(g_particles, 'scale', 0.1, 10.0, 0.1).listen();
  particles.close();

  let info = gui.addFolder('Info');
  info.add(g_guiInfo, 'scene').listen();
  info.add(g_guiInfo, 'control');
  info.open();

  particalController.onChange(function(value) {
    if (value) {
      resetParticles(g_particles);
    } else {
      clearParticles();
    }
  });
}
