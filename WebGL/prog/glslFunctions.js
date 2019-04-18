/**
 * Sends a WebGL 2D texture object (created by load2DTexture) and sends it to
 * the shaders.
 *
 * @param val The WebGL 2D texture object being passed
 * @param {Number} textureUnit The texture unit (0 - 7) where the texture will reside
 * @param {String} uniformName The name of the uniform variable where the texture's
 * textureUnit location (0 - 7) will reside
 */
function send2DTextureToGLSL(val, textureUnit, uniformName) {
  // Recomendations: Within this funciton, you should:
  //    1. Gather your uniform location
  //    2. Determine the exture unit you will be using (gl.TEXTURE"N")
  //    3. Activate your texture unit using gl.activeTexture
  //    4. Bind your texture using gl.bindTexture
  //    5. Send the texture unit (textureUnit not the one you found) to your
  //       uniform location.

  let u_sample = gl.getUniformLocation(gl.program, uniformName);
  if (!u_sample) {
    console.log('Failed to get the storage location of' + uniformName);
    return false;
  }
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, val);
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_sample, 0);
}

/**
 * Creates a WebGl 2D texture object.
 *
 * @param imgPath A file path/data url containing the location of the texture image
 * @param magParam texParameteri for gl.TEXTURE_MAG_FILTER. Can be gl.NEAREST,
 * gl.LINEAR, etc.
 * @param minParam texParameteri for gl.TEXTURE_MIN_FILTER. Can be gl.NEAREST,
 * gl.LINEAR, etc.
 * @param wrapSParam texParameteri for gl.TEXTURE_WRAP_S. Can be gl.REPEAT,
 * gl. MIRRORED_REPEAT, or gl.CLAMP_TO_EDGE.
 * @param wrapTParam texParameteri for gl.TEXTURE_WRAP_S. Can be gl.REPEAT,
 * gl. MIRRORED_REPEAT, or gl.CLAMP_TO_EDGE.
 * @param callback A callback function which executes with the completed texture
 * object passed as a parameter.
 */
function create2DTexture(imgPath, magParam, minParam, wrapSParam, wrapTParam, callback) {
  // Recomendations: This function should see you creating an Image object,
  // setting that image object's ".onload" to an anonymous function containing
  // the rest of your code, and setting that image object's ".src" to imgPath.
  //
  // Within the anonymous function:
  //  1. create a texture object by saving the result of gl.createTexture()
  //  2. Flip your image's y-axis and bind your texture object to gl.TEXTURE_2D
  //  3. Using multiple calls to gl.texParameteri, pass magParam, minParam,
  //     wrapSParam, and wrapTParam.
  //  4. Set the texture's image to the loaded image using gl.texImage2D
  //  5. Pass your completed texture object to your callback function
  //
  // NOTE: This function should not return anything.
  let image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }

  // Register the event handler to be called on loading an image
  image.onload = function(){
    let texture = gl.createTexture();   // Create a texture object
    if (!texture) {
      console.log('Failed to create the texture object');
      return false;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minParam);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magParam);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapSParam);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapTParam);

    callback(texture);
  };
  // Tell the browser to load an image
  image.src = imgPath;
}

/**
 * Sends data to an attribute variable using a buffer.
 *
 * @private
 * @param {Float32Array} data Data being sent to attribute variable
 * @param {Number} dataCount The amount of data to pass per vertex
 * @param {String} attribName The name of the attribute variable
 */
function sendAttributeBufferToGLSL(data, dataCount, attribName) {
  // Recommendations: This piece of code should do these three things:
  // 1. Create a an attribute buffer
  // 2. Bind data to that buffer
  // 3. Enable the buffer for use
  //
  // Some modifications can be made to this function to improve performance. Ask
  // a TA in lab if you're interested in these modifications.
  // Create a buffer object
  let newBuffer = gl.createBuffer();
  if (!newBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, newBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  let attribLoc = gl.getAttribLocation(gl.program, attribName);
  if (attribLoc < 0) {
    console.log('Failed to get the storage location of ' + attribName);
    return -1;
  }
  // Assign the buffer object to an attribute variable
  gl.vertexAttribPointer(attribLoc, dataCount, gl.FLOAT, false, 0, 0);

  // Enable the assignment to an attribute variable
  gl.enableVertexAttribArray(attribLoc);

}
/**
 * set indices buffer
 *
 * @private
 * @param {Uint8Array} indices Data being sent to attribute variable
 */
function setIndexBuffer(indices) {
// Write the indices to the buffer object
  let indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}
/**
 * Draws the current buffer loaded. Buffer was loaded by sendAttributeBufferToGLSL.
 * @param {Integer} pointCount The amount of indices being drawn from the buffer.
 */
function tellGLSLToDrawCurrentBuffer(pointCount) {
  // Recommendations: Should only be one line of code.
  gl.drawElements(gl.TRIANGLES, pointCount, gl.UNSIGNED_BYTE, 0);
}

/**
 * Draws the current buffer loaded. Buffer was loaded by sendAttributeBufferToGLSL.
 * @param {Integer} pointCount The amount of vertices being drawn from the buffer.
 */
function tellGLSLToDrawArrays(pointCount) {
  gl.drawArrays(gl.TRIANGLES, 0, pointCount);
}

/**
 * Sends a unsigned int value to the specified uniform variable within GLSL shaders.
 * Prints an error message if unsuccessful.
 *
 * @param {int} val The float value being passed to uniform variable
 * @param {String} uniformName The name of the uniform variable
 */
function sendUniformUintToGLSL(val, uniformName) {
  //
  // YOUR CODE HERE
  //
  let val_loc = gl.getUniformLocation(gl.program, uniformName);
  if (val_loc < 0) {
    console.log('Failed to get the storage location of ' + uniformName);
    return;
  }
  gl.uniform1ui(val_loc, val);
}

/**
 * Sends a float value to the specified uniform variable within GLSL shaders.
 * Prints an error message if unsuccessful.
 *
 * @param {float} val The float value being passed to uniform variable
 * @param {String} uniformName The name of the uniform variable
 */
function sendUniformFloatToGLSL(val, uniformName) {
  //
  // YOUR CODE HERE
  //
  let val_loc = gl.getUniformLocation(gl.program, uniformName);
  if (val_loc < 0) {
    console.log('Failed to get the storage location of ' + uniformName);
    return;
  }
  gl.uniform1f(val_loc, val);
}

/**
 * Sends an JavaSript array (vector) to the specified uniform variable within
 * GLSL shaders. Array can be of length 4.
 *
 * @param {Array} val Array (vector) being passed to uniform variable
 * @param {String} uniformName The name of the uniform variable
 */
function sendUniformVec4ToGLSL(val, uniformName) {
  //
  // YOUR CODE HERE
  //
  let val_loc = gl.getUniformLocation(gl.program, uniformName);
  if (val_loc < 0) {
    console.log('Failed to get the storage location of ' + uniformName);
    return;
  }
  gl.uniform4f(val_loc, val[0], val[1], val[2], val[3]);
}

/**
 * Sends an JavaSript array (vector) to the specified uniform variable within
 * GLSL shaders. Array can be of length 3.
 *
 * @param {Array} val Array (vector) being passed to uniform variable
 * @param {String} uniformName The name of the uniform variable
 */
function sendUniformVec3ToGLSL(val, uniformName) {
  let val_loc = gl.getUniformLocation(gl.program, uniformName);
  if (val_loc < 0) {
    console.log('Failed to get the storage location of ' + uniformName);
    return;
  }
  gl.uniform3f(val_loc, val[0], val[1], val[2]);
}

/**
 * Sends an JavaSript array (vector) to the specified uniform variable within
 * GLSL shaders. Array can be of length 2.
 *
 * @param {Array} val Array (vector) being passed to uniform variable
 * @param {String} uniformName The name of the uniform variable
 */
function sendUniformVec2ToGLSL(val, uniformName) {
  let val_loc = gl.getUniformLocation(gl.program, uniformName);
  if (val_loc < 0) {
    console.log('Failed to get the storage location of ' + uniformName);
    return;
  }
  gl.uniform2f(val_loc, val[0], val[1]);
}

/**
 * Sends data to a uniform variable expecting a matrix value.
 *
 * @private
 * @param {Array} val Value being sent to uniform variable
 * @param {String} uniformName Name of the uniform variable recieving data
 */
 function sendUniformMat4ToGLSL(val, uniformName) {
   // Recomendations: This is going to be very similar to sending a float/vec.
   let val_loc = gl.getUniformLocation(gl.program, uniformName);
   if (val_loc < 0) {
     console.log('Failed to get the storage location of ' + uniformName);
     return;
   }
   gl.uniformMatrix4fv(val_loc, false, val.elements);
}
