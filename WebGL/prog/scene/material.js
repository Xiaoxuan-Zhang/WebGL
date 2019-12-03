/**
 * Specifies a material object.
 *
 * @author "Xiaoxuan Zhang"
 * @this {Geometry}
 */
class Material {
  /**
   * Constructor for Material.
   *
   * @constructor
   */
  constructor(uniforms=null, shader=null) {
    this.uniforms = uniforms;
    this.shader = shader;
    this.textureUnit = {}; //keep track of texture unit
    this.textureUnitCount = 0;
  }

  setShader(shader) {
    this.shader = shader;
  }

  setUniforms(uniforms) {
    this.uniforms = uniforms;
  }
  /**
   * Sends data to a uniform variable
   *
   * @public
   * @param {String} name uniform name
   * @param {Object} uniform an object containing type and value of this uniform
   */
   sendUniformToGLSL() {
     for(let key in this.uniforms) {
       let name = key;
       let type = "f";
       let value = this.uniforms[key].value;
       if ("type" in this.uniforms[key])
       {
         type = this.uniforms[key].type;
       }
       if (type == "f"){
         sendUniformFloatToGLSL(value, name);
       } else if (type == "int") {
         sendUniformUintToGLSL(value, name);
       } else if (type == "texture") {
         if (!(name in this.textureUnit)) {
           send2DTextureToGLSL(value, this.textureUnitCount, name);
           this.textureUnit[name] = this.textureUnitCount;
           this.textureUnitCount += 1;
         } else {
           send2DTextureToGLSL(value, this.textureUnit[name], name);
         }
       } else if (type == "cubemap") {
         if (!(name in this.textureUnit)) {
           sendCubemapToGLSL(value, this.textureUnitCount, name);
           this.textureUnit[name] = this.textureUnitCount;
           this.textureUnitCount += 1;
         } else {
           sendCubemapToGLSL(value, this.textureUnit[name], name);
         }
       } else if (type == "v2"){
         sendUniformVec2ToGLSL(value, name);
       } else if (type == "v3"){
         sendUniformVec3ToGLSL(value, name);
       } else if (type == "v4"){
         sendUniformVec4ToGLSL(value, name);
       } else if (type == "mat4"){
         sendUniformMat4ToGLSL(value, name);
       }
     }
  }
}
