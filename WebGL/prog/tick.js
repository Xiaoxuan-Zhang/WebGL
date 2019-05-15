/**
 * Responsible for animating the Scene.
 */
function tick() {
  // Recomendations: You're going to want to call this at the end of your main()
  // in main.js. requestAnimationFrame() needs to be used here (read the book).
  if (g_totalObjects == g_loadedObjects && (!g_loaded))
  {
    //document.getElementById('headline').innerHTML = "Main scene: Ready!"
    g_guiInfo.scene = 'Ready!';
    scene.init();
    addObjects();
    g_loaded = true;
  }
  scene.updateAnimation();
  scene.render();
  requestAnimationFrame(tick, canvas);

}
