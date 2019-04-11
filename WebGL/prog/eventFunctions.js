var isMousedown = false;
var g_object;
var g_texture;

/**
 * Responsible for initializing buttons, sliders, radio buttons, etc. present
 * within your HTML document.
 */
function initEventHandelers() {
  canvas.onmouseup = function(ev){
    isMousedown = false;
  };
  canvas.onmousedown = function(ev){
    isMousedown = true;
    click(ev)
  };
  canvas.onmousemove = function(ev){
    if (isMousedown)
    {
      click(ev);
    }
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    x = (x - rect.left) * 2.0/canvas.width - 1.0;
    y = (y - rect.top) * -2.0/canvas.height + 1.0;
    sendTextToHTML(x.toFixed(2), 'x_value');
    sendTextToHTML(y.toFixed(2), 'y_value');
  };

  document.onkeydown = function(ev){ keydown(ev); };
  window.addEventListener("resize", resizeCanvas, false);
  document.getElementById("displacement-value").addEventListener("change", setDisplacement, false);
  document.getElementById("sealevel-value").addEventListener("change", setSeaLevel, false);
}

function resizeCanvas() {
  var realToCSSPixels = window.devicePixelRatio;
  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (canvas.width  != displayWidth ||
      canvas.height != displayHeight) {

    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
/**
 * Function called upon mouse click or mouse drag. Computes position of cursor,
 * pushes cursor position as GLSL coordinates, and draws.
 *
 * @param {Object} ev The event object containing the mouse's canvas position
 */
function click(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  x = (x - rect.left) * 2.0/canvas.width - 1.0;
  y = (y - rect.top) * -2.0/canvas.height + 1.0;

}

function keydown(ev) {
    if(ev.key == 'w') {
      camera.move("forward");
    } else if (ev.key == 's') {
      camera.move("backward");
    } else if (ev.key == 'a') {
      camera.move("right");
    } else if (ev.key == 'd'){
      camera.move("left");
    } else if (ev.key == 'i'){
      camera.rotate("up");
    } else if (ev.key == 'k'){
      camera.rotate("down");
    } else if (ev.key == 'j'){
      camera.rotate("left");
    } else if (ev.key == 'l'){
      camera.rotate("right");
    }
    else
    { return; } // Prevent the unnecessary drawing
}
/**
 * Clears the HTML canvas.
 */
function clearCanvas() {
  scene.clearGeometry();
  gl.clear(gl.COLOR_BUFFER_BIT);
  scene.init();
}

function handleObjFiles(files){
  var filename = files[0];
  if (filename) {
      var reader = new FileReader();
      reader.onload = function(e) {
	      var obj_text = e.target.result;
        g_object = new LoadedOBJ(obj_text);
      };
      reader.readAsText(filename);
  } else {
      alert("Failed to load file");
  }
}

function customTextureLoadedCallback(texture)
{
  g_texture["custom"] = texture;
}

function handleTextureFiles(files){
  var filename = files[0];
  if (filename)
  {
    var reader = new FileReader();
    reader.onload = function(e) {
      create2DTexture(e.target.result, gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT, customTextureLoadedCallback);
    }
    reader.readAsDataURL(filename);
  } else {
    alert("Failed to load file");
  }
}

function setDisplacement() {
  g_terrain["displacement"] = Number(document.getElementById("displacement-value").value);
}

function setSeaLevel() {
  g_terrain["seaLevel"] = Number(document.getElementById("sealevel-value").value);
}
