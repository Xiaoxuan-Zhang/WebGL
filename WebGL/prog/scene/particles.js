/**
 * Specifies a particle system.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Particles}
 */

 class Particles {
   /**
    * Constructor for Particles.
    *
    * @constructor
    */
   constructor() {
     this.FBO = [0, 0];
     createFBO();
   }

   createFBO() {
     // Create and bind the framebuffer
     this.FBO[0] = gl.createFramebuffer();
     this.FBO[1] = gl.createFramebuffer();
   }

   updateAnimation() {

   }
   
   render() {

   }
 }
