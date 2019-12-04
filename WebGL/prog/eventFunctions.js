var isMousedown = false;

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
    let x = ev.clientX;
    let y = ev.clientY;
    let rect = ev.target.getBoundingClientRect();
    x = (x - rect.left) * 2.0/canvas.width - 1.0;
    y = (y - rect.top) * -2.0/canvas.height + 1.0;
    g_mousePos = [x, y];
  };

  document.onkeydown = function(ev){ keydown(ev); };
  window.addEventListener("resize", resizeCanvas, false);
}

function resizeCanvas() {
  let realToCSSPixels = window.devicePixelRatio;
  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  let displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  let displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (gl.canvas.width  != displayWidth ||
      gl.canvas.height != displayHeight) {

    // Make the canvas the same size
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
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
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();
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

function handleObjFiles(files){
  let filename = files[0];
  if (filename) {
      let reader = new FileReader();
      reader.onload = function(e) {
	      let obj_text = e.target.result;
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
  let filename = files[0];
  if (filename)
  {
    let reader = new FileReader();
    reader.onload = function(e) {
      create2DTexture(e.target.result, gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT, customTextureLoadedCallback);
    }
    reader.readAsDataURL(filename);
  } else {
    alert("Failed to load file");
  }
}
