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
    * @param {Number} count the number of particles
    */
   constructor() {
     this.data = null;
     this.vaos = [];
     this.buffers = [];
     this.updateAttributes = null;
     this.renderAttributes = null;
     this.renderProgram = null;
     this.updateProgram = null;
     this.spriteBuffer = null;
     this.spriteAttributes = null;
     this.bornParticles = 0;
     this.numOfParts = 0;
     this.prevTime = 0.0;
     this.totalTime = 0.0;
     this.origin = [0.0, 0.0];
     this.read = 0;
     this.write = 1;
     this.params = null;
     this.renderPoints = false;
   }

   generateData(numOfParts, minAge, maxAge) {
     var data = [];
     var count = Math.floor(numOfParts);
     for (var i = 0; i < count; ++i) {
       //position
       data.push(0.0); //x
       data.push(0.0); //y
       data.push(0.0); //z

       //life
       var life = minAge + Math.random() * (maxAge - minAge);
       data.push(life + 1);
       data.push(life);

       //velocity
       data.push(0.0);
       data.push(0.0);
       data.push(0.0);
     }
     return data;
   }

   setupBufferVAO(vao, buffers) {
     gl.bindVertexArray(vao);
     for (var i = 0; i < buffers.length; ++i) {
       let buffer = buffers[i];
       let stride = buffer.stride;
       let dataSize = 4;
       let offset = 0;
       gl.bindBuffer(gl.ARRAY_BUFFER, buffer.bufferObj);
       for (var attrName in buffer.attributes) {
         var attribute = buffer.attributes[attrName];
         let attribLoc = attribute.location;
         if (attribLoc < 0) {
           console.log('Failed to get the storage location of ' + attrName);
           return -1;
         }
         // Enable the assignment to an attribute variable
         gl.enableVertexAttribArray(attribLoc);
         // Assign the buffer object to an attribute variable
         gl.vertexAttribPointer(attribLoc, attribute.dataCount, attribute.type, false, stride, offset);
         offset += attribute.dataCount * dataSize;
         if (attribute.hasOwnProperty("divisor")) {
          gl.vertexAttribDivisor(attribLoc, attribute.divisor);
        }
       }
     }
     gl.bindBuffer(gl.ARRAY_BUFFER, null);
     gl.bindVertexArray(null);
   }

   init(particleParams) {
     this.params = particleParams;
     this.updateProgram = createShader(
      gl, PARTICLES_UPDATE_VSHADER, PARTICLES_UPDATE_FSHADER,
      [
        "o_position",
        "o_age",
        "o_lifeSpan",
        "o_velocity"
      ]);
    this.renderPointProgram = createShader(
      gl, PARTICLES_RENDER_VSHADER, PARTICLES_RENDER_FSHADER, null);

    this.renderQuadProgram = createShader(
      gl, PARTICLES_RENDER_QUAD_VSHADER, PARTICLES_RENDER_QUAD_FSHADER, null);

    if (!this.updateProgram || !this.renderPointProgram || !this.renderQuadProgram)
    {
      console.log('Failed to create shaders');
      return;
    }

    if (this.renderPoints) {
      this.renderProgram = this.renderPointProgram;
    } else {
      this.renderProgram = this.renderQuadProgram;
    }

    this.buffers = [
      gl.createBuffer(),
      gl.createBuffer()
    ];

    var spriteData =
      new Float32Array([
        1, 1,
        1, 1,

        -1, 1,
        0, 1,

        -1, -1,
        0, 0,

        1, 1,
        1, 1,

        -1, -1,
        0, 0,

        1, -1,
        1, 0]);

    this.spriteAttributes = {
      i_coord: {
        location: gl.getAttribLocation(this.renderProgram, "i_coord"),
        dataCount: 2,
        type: gl.FLOAT
      },
      i_texCoord: {
        location: gl.getAttribLocation(this.renderProgram, "i_texCoord"),
        dataCount: 2,
        type: gl.FLOAT
      }
    };

    this.spriteBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, spriteData, gl.STATIC_DRAW);

    this.updateAttributes = {
      i_position: {
        location: gl.getAttribLocation(this.updateProgram, "i_position"),
        dataCount: 3,
        type: gl.FLOAT
      },
      i_age: {
        location: gl.getAttribLocation(this.updateProgram, "i_age"),
        dataCount: 1,
        type: gl.FLOAT
      },
      i_lifeSpan: {
        location: gl.getAttribLocation(this.updateProgram, "i_lifeSpan"),
        dataCount: 1,
        type: gl.FLOAT
      },
      i_velocity: {
        location: gl.getAttribLocation(this.updateProgram, "i_velocity"),
        dataCount: 3,
        type: gl.FLOAT
      }
    };

    this.renderAttributes = {
      i_position: {
        location: gl.getAttribLocation(this.renderProgram, "i_position"),
        dataCount: 3,
        type: gl.FLOAT,
        divisor: 1
      },
      i_age: {
        location: gl.getAttribLocation(this.renderProgram, "i_age"),
        dataCount: 1,
        type: gl.FLOAT,
        divisor: 1
      },
      i_lifeSpan: {
        location: gl.getAttribLocation(this.renderProgram, "i_lifeSpan"),
        dataCount: 1,
        type: gl.FLOAT,
        divisor: 1
      },
      i_velocity: {
        location: gl.getAttribLocation(this.renderProgram, "i_velocity"),
        dataCount: 3,
        type: gl.FLOAT,
        divisor: 1
      }
    };

    this.vaos = [
      {
        vao: gl.createVertexArray(), // for updating buffer 0
        buffers:
        [{
          bufferObj: this.buffers[0],
          stride: 4 * 8,
          attributes: this.updateAttributes
        }]
      },
      {
        vao: gl.createVertexArray(), // for updating buffer 1
        buffers:
        [{
          bufferObj: this.buffers[1],
          stride: 4 * 8,
          attributes: this.updateAttributes
        }]
      },
      {
        vao: gl.createVertexArray(), // for rendering buffer 0
        buffers:
        [{
          bufferObj: this.buffers[0],
          stride: 4 * 8,
          attributes: this.renderAttributes
        },
        {
          bufferObj: this.spriteBuffer,
          stride: 4 * 4,
          attributes: this.spriteAttributes
        }]
      },
      {
        vao: gl.createVertexArray(), // for rendering buffer 1
        buffers:
        [{
          bufferObj: this.buffers[1],
          stride: 4 * 8,
          attributes: this.renderAttributes
        },
        {
          bufferObj: this.spriteBuffer,
          stride: 4 * 4,
          attributes: this.spriteAttributes
        }]
      }
    ];


    this.initData = new Float32Array(this.generateData(particleParams.amount,
                                                        particleParams.minAge,
                                                        particleParams.maxAge));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[0]);
    gl.bufferData(gl.ARRAY_BUFFER, this.initData, gl.STREAM_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[1]);
    gl.bufferData(gl.ARRAY_BUFFER, this.initData, gl.STREAM_DRAW);

    for (var i = 0; i < this.vaos.length; ++i) {
      this.setupBufferVAO(this.vaos[i].vao, this.vaos[i].buffers);
    }
   }

   render() {
     gl.disable(gl.DEPTH_TEST);
     gl.enable(gl.BLEND);
     //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
     gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

     //calculate delta time and update prevTime
     let deltaTime = 0.0;
     let currTime = performance.now() / 1000.0;
     if (this.prevTime != 0.0) {
       deltaTime = currTime - this.prevTime;
       if (deltaTime > 0.5) {
         deltaTime = 0.0;
       }
     }

     this.prevTime = currTime;
     this.totalTime += deltaTime;

     //update bornParticles according to birthRate and deltaTime
     let numOfParts = this.params.amount; //this.bornParticles;
     if (this.bornParticles < this.params.amount) {
       this.bornParticles = Math.min(this.params.amount, Math.floor(this.bornParticles + this.params.birthRate * deltaTime));
     } else if (this.bornParticles > this.params.amount){
       //the amount of particles has just decreased, reset bornParticles
       numOfParts = 0;
       this.bornParticles = 0;
     }

     //draw
     useShader(gl, this.updateProgram)

     //send uniforms
     sendUniformFloatToGLSL(deltaTime, "u_timeDelta");
     sendUniformVec4ToGLSL([this.params.minTheta,
                            this.params.maxTheta,
                            this.params.minSpeed,
                            this.params.maxSpeed], "u_params");
     sendUniformVec2ToGLSL([this.params.force, this.params.gravity], "u_move");
     sendUniformVec2ToGLSL(g_mousePos, "u_origin");
     send2DTextureToGLSL(g_texture["noise"]["noise512"], 0, "u_randomTex");
     send2DTextureToGLSL(g_texture["noise"]["turbulence"], 1, "u_noiseTex");


     //update particles
     gl.bindVertexArray(this.vaos[this.read].vao);
     gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.buffers[this.write]);
     gl.enable(gl.RASTERIZER_DISCARD);

     //begin transform feedback
     gl.beginTransformFeedback(gl.POINTS);
     gl.drawArrays(gl.POINTS, 0, numOfParts);
     gl.endTransformFeedback();
     gl.disable(gl.RASTERIZER_DISCARD);
     gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

     //render particles
     gl.bindVertexArray(this.vaos[this.read + 2].vao);

     //draw points
     // useShader(gl, this.renderProgram);
     // gl.drawArrays(gl.POINTS, 0, numOfParts);

     //draw sprites
     useShader(gl, this.renderProgram);
     let modelMatrix = new Matrix4();
     modelMatrix.setTranslate(0.0, 0.0, 0.0);

     sendUniformMat4ToGLSL(modelMatrix, "u_model");
     sendUniformMat4ToGLSL(camera.viewMatrix, "u_view");
     sendUniformMat4ToGLSL(camera.projectionMatrix, "u_projection");
     send2DTextureToGLSL(g_texture["dot"]["dot"], 0, "u_spriteTex");
     gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, numOfParts);

     //swap read and write buffers
     let temp = this.read;
     this.read = this.write;
     this.write = temp;

     gl.bindVertexArray(null);

     gl.disable(gl.BLEND);
     gl.enable(gl.DEPTH_TEST);
   }
 }
