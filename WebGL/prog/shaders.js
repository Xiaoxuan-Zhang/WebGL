var BASICLIGHTS_VSHADER1 =
  `
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform sampler2D u_normal;

  attribute vec4 a_position;
  attribute vec3 a_normal;
  attribute vec2 a_texCoord;

  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_fragPos;
  varying vec3 v_lightPos;
  varying vec3 v_cameraPos;
  void main(){
    gl_Position = u_projection * u_view * u_model * a_position;
    vec3 texNor = texture2D(u_normal, v_texCoord).rgb;
    v_normal = mat3(u_normalMatrix) * a_normal; //Transform to model space
    v_fragPos = vec3(u_model * a_position); //Transform to model space
    v_lightPos = vec3(u_model * vec4(u_lightPos, 1.0)); //Transform to model space
    v_cameraPos = vec3(u_model * vec4(u_cameraPos, 1.0));
    v_texCoord = a_texCoord;
  }
  `;

var BASICLIGHTS_FSHADER1 =
  `
  precision mediump float;

  uniform vec3 u_lightColor;
  uniform vec3 u_specularColor;
  uniform sampler2D u_sample;
  uniform sampler2D u_specular;

  varying vec3 v_normal;
  varying vec3 v_fragPos;
  varying vec3 v_lightPos;
  varying vec3 v_cameraPos;
  varying vec2 v_texCoord;
  void main(){
    vec3 texDiff = texture2D(u_sample, v_texCoord).rgb;
    vec3 texSpec = texture2D(u_specular, v_texCoord).rgb;

    vec3 normal = normalize(v_normal);
    //calculate ambient light
    vec3 ambientColor = 0.05 * u_lightColor * texDiff;
    //calculate diffuse light
    vec3 lightDir = normalize(v_lightPos - v_fragPos);
    float nDotL = max(dot(lightDir, normal), 0.0);
    vec3 diffuseColor = texDiff * nDotL;
    //calculate specular light
    vec3 viewDir = normalize(v_cameraPos-v_fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(reflectDir, viewDir), 0.0), 64.0);
    vec3 specularColor = u_specularColor * spec * texSpec.r;
    gl_FragColor = vec4(ambientColor + diffuseColor + specularColor , 1.0);

  }
  `;

var TEX_VSHADER1 =
  `
    precision mediump float;
    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    attribute vec3 a_normal;
    varying vec2 v_texCoord;
    varying vec3 v_normal;

    void main(){
      gl_Position = u_projection * u_view * u_model * a_position;
      v_texCoord = a_texCoord;
      v_normal = a_normal;
    }
  `;

var TEX_FSHADER1 =
  `
  precision mediump float;
  uniform sampler2D u_sample;
  varying vec2 v_texCoord;
  varying vec3 v_normal;

  void main(){
    vec4 texColor = texture2D(u_sample, v_texCoord);
    gl_FragColor = texColor;

  }
  `;

var CUSTOM_VSHADER1 =
`
  precision mediump float;
  uniform mat4 u_model;

  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;
  varying vec2 v_texCoord;
  varying vec3 v_normal;

  void main(){
    gl_Position = u_model * a_position;
    v_texCoord = a_texCoord;
    v_normal = a_normal;
  }
`;

var CUSTOM_FSHADER1 =
`
precision mediump float;
uniform sampler2D u_sample;
//uniform sampler2D u_depth;
varying vec2 v_texCoord;
varying vec3 v_normal;

void main(){
  vec4 texColor = texture2D(u_sample, v_texCoord);
  gl_FragColor = texColor;

}
`;

var TERRAIN_VSHADER1 =
`
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;
  uniform float u_displacement;
  uniform vec3 u_noise;
  uniform vec2 u_mouse;
  uniform vec3 u_cameraPos;
  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;
  varying vec2 v_texCoord;
  varying float v_noise;
  varying vec3 v_normal;
  varying vec3 v_fragPos;
  const int OCTAVES = 8;
  const bool CALC_NORM = true;
  //
  // Description : Array and textureless GLSL 2D simplex noise function.
  //      Author : Ian McEwan, Ashima Arts.
  //  Maintainer : stegu
  //     Lastmod : 20110822 (ijm)
  //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
  //               Distributed under the MIT License. See LICENSE file.
  //               https://github.com/ashima/webgl-noise
  //               https://github.com/stegu/webgl-noise
  //
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  float snoise(vec2 v)
    {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
  // First corner
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
  // Other corners
    vec2 i1;
    //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
    //i1.y = 1.0 - i1.x;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    // x0 = x0 - 0.0 + 0.0 * C.xx ;
    // x1 = x0 - i1 + 1.0 * C.xx ;
    // x2 = x0 - 1.0 + 2.0 * C.xx ;
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
  // Permutations
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  		+ i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
  // Gradients: 41 points uniformly over a line, mapped onto a diamond.
  // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
  // Normalise gradients implicitly by scaling m
  // Approximation of: m *= inversesqrt( a0*a0 + h*h );
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  // Compute final noise value at P
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float getHeight(vec2 v) {
    float persistance = u_noise[0];
    float lacunarity = u_noise[1];
    float exponent = u_noise[2];
    vec2 offset = u_mouse * 10.0;
    float freq = 0.005;
    float amplitude = 1.0;
    float noise_value = 0.0;
    for (int i = 0; i < OCTAVES; i ++) {
      float sample_x = freq * v.x + offset.x;
      float sample_y = freq * v.y + offset.y;
      noise_value += amplitude * (0.5 * snoise(vec2(sample_x, sample_y)) + 0.5);
      amplitude *= persistance;
      freq *= lacunarity;
    }
    noise_value = pow(noise_value, exponent);
    return noise_value;
  }
  //estimate normal based on central differences
  vec3 getNormal(vec3 pos, vec2 diff) {
    float hL = getHeight(pos.xz - diff.xy);
    float hR = getHeight(pos.xz + diff.xy);
    float hD = getHeight(pos.xz - diff.yx);
    float hU = getHeight(pos.xz + diff.yx);
    vec3 normal = normalize(vec3(hL - hR, 2.0, hD - hU)); //always assume normal towards positive Y axis
    return normal;
  }
  void main(){
    vec4 world_pos = u_model * a_position;
    float height = getHeight(world_pos.xz);
    vec3 new_position = world_pos.xyz + a_normal * u_displacement * height;
    gl_Position = u_projection * u_view * vec4(new_position, 1.0);
    v_noise = height;
    v_texCoord = a_texCoord;
    vec2 diff = vec2(10.0, 0.0);
    if (CALC_NORM) {
      v_normal = getNormal(world_pos.xyz, diff);
    } else {
      v_normal = (u_normalMatrix * vec4(a_normal, 1.0)).xyz;
    }
    v_fragPos = new_position;
  }
`;

var TERRAIN_FSHADER1 =
`
precision mediump float;
uniform vec3 u_terrain;
uniform vec3 u_cameraPos;
uniform float u_time;
varying float v_noise;
varying vec3 v_normal;
varying vec2 v_texCoord;
varying vec3 v_fragPos;
const vec3 LIGHT_POSITION = vec3(0.0, 50.0, -50.0);
const vec3 DIFFUSE_COLOR = vec3(0.01, 0.39, 0.41);
const vec3 SPECULAR_COLOR = vec3(0.96, 0.95, 0.8);
const bool LIGHTING_ENABLED = true;
float rand(vec2 v){
    return fract(sin(dot(v ,vec2(12.9898,78.233))) * 43758.5453);
}
vec3 calcLights() {
  vec3 color = vec3(1.0);
  if (LIGHTING_ENABLED) {
    //ambient
    vec3 baseColor = vec3(0.01, 0.1, 0.89) * 0.5;
    //diffuse
    vec3 norm = normalize(v_normal);
    vec3 lightDir = normalize(LIGHT_POSITION - v_fragPos);
    float diffuse = max(dot(lightDir, norm), 0.0);
    vec3 diffuseColor = DIFFUSE_COLOR * diffuse;
    //specular
    vec3 viewDir = normalize(u_cameraPos - v_fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float specular = pow(max(dot(reflectDir, viewDir), 0.0), 64.0);
    vec3 specularColor = SPECULAR_COLOR * specular * 0.5;
    color = baseColor + diffuseColor;
  }
  return color;
}
vec3 snow() {
  vec3 snow_color = vec3(0.5);
  snow_color *= calcLights();
  vec2 v = v_fragPos.xz;
  if (rand(v) > 0.999) {
    snow_color += abs(sin(u_time + v.x*v.y)) * vec3(1.0);
  }
  return snow_color;
}
vec3 earth() {
  vec3 earth_color = vec3(0.44, 0.28, 0.24) * v_noise;
  earth_color *= calcLights();
  return earth_color;
}
vec3 water() {
  vec3 water_color = vec3(0.0, 0.06, 0.3) ;
  water_color *= calcLights();
  return water_color;
}
void main(){
  float waterLevel = u_terrain[0];
  float earthLevel = u_terrain[1];
  float snowLevel = u_terrain[2];
  vec3 color = water();
  vec3 light_dir = LIGHT_POSITION - v_fragPos;
  if (v_noise > snowLevel) {
    color = snow();
  } else if (v_noise > earthLevel) {
    color = earth();
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

var TERRAIN_VSHADER2 =
`
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;
  uniform float u_displacement;
  uniform vec3 u_noise;
  uniform vec3 u_terrain;
  uniform vec2 u_mouse;
  uniform vec3 u_cameraPos;
  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;
  varying vec2 v_texCoord;
  varying float v_noise;
  varying vec3 v_normal;
  varying vec3 v_fragPos;

#define CALC_NORM 1

  const int OCTAVES = 8;
  const mat2 m2 = mat2(  0.80,  0.60,
                        -0.60,  0.80 );
  const mat2 m2i = mat2( 0.80, -0.60,
                         0.60,  0.80 );

  // return smoothstep and its derivative
  vec2 smoothstepd( float a, float b, float x)
  {
    if( x<a ) return vec2( 0.0, 0.0 );
    if( x>b ) return vec2( 1.0, 0.0 );
    float ir = 1.0/(b-a);
    x = (x-a)*ir;
    return vec2( x*x*(3.0-2.0*x), 6.0*x*(1.0-x)*ir );
  }

  float hash1(vec2 p)
  {
  	vec3 p3  = fract(vec3(p.xyx) * 0.013);
      p3 += dot(p3, p3.yzx + 19.31);
      return fract((p3.x + p3.y) * p3.z);
  }

  vec3 noised( in vec2 x )
  {
      vec2 p = floor(x);
      vec2 w = fract(x);

      vec2 u = w*w*w*(w*(w*6.0-15.0)+10.0);
      vec2 du = 30.0*w*w*(w*(w-2.0)+1.0);

      float a = hash1(p+vec2(0,0));
      float b = hash1(p+vec2(1,0));
      float c = hash1(p+vec2(0,1));
      float d = hash1(p+vec2(1,1));

      float k0 = a;
      float k1 = b - a;
      float k2 = c - a;
      float k4 = a - b - c + d;

      return vec3( -1.0+2.0*(k0 + k1*u.x + k2*u.y + k4*u.x*u.y),
                        2.0 * du * vec2( k1 + k4*u.y,
                                        k2 + k4*u.x ) );
  }

  vec3 fbmd(vec2 v) {
    float persistance = u_noise[0];
    float lacunarity = u_noise[1];
    float freq = 1.0;
    float amplitude = 0.5;
    mat2  m = mat2(1.0,0.0,0.0,1.0);
    float value = 0.0;
    vec2 d = vec2(0.0);
    vec2 sample = v;
    for (int i = 0; i < OCTAVES; i++) {
      vec3 n = noised(sample);
      value += amplitude * n.x;
      d += amplitude * m * n.yz;
      amplitude *= persistance;
      sample = lacunarity*m2*sample;
      m = lacunarity*m2i*m;
    }
    return vec3(value, d);
  }

  vec4 terrainHeight(vec2 v) {
    v *= 0.01;
    vec3 h = fbmd(v + u_mouse);
    vec2 s = smoothstepd(-0.6, 0.6, h.x);
    h.x = s.x;
    h.yz += s.y * h.yz;
    return vec4(h.x, normalize(vec3(-h.y, 1.0, -h.z)));;
  }

  void main(){
    vec4 world_pos = u_model * a_position;
    vec4 height = terrainHeight(world_pos.xz);
    vec3 new_position = world_pos.xyz + a_normal * u_displacement * height.x;

    gl_Position = u_projection * u_view * vec4(new_position, 1.0);
    v_noise = height.x;
    v_texCoord = a_texCoord;

#if CALC_NORM == 1
      v_normal = height.yzw;
#else
      v_normal = (u_normalMatrix * vec4(a_normal, 1.0)).xyz;
#endif

    v_fragPos = new_position;
  }
`;

var TERRAIN_FSHADER2 =
`
precision mediump float;
uniform vec3 u_terrain;
uniform vec3 u_cameraPos;
uniform vec2 u_clip;
uniform float u_time;
varying float v_noise;
varying vec3 v_normal;
varying vec2 v_texCoord;
varying vec3 v_fragPos;

const vec3 SNOW_COLOR = vec3(0.2);
const vec3 SKY_COLOR = vec3(0.58, 0.65, 0.8);
const vec3 EARTH_BROWN = vec3(0.063, 0.034, 0.015);
const vec3 EARTH_DARKBROWN = vec3(0.063, 0.024, 0.01) * 0.9;
const vec3 LIGHT_DIR = vec3(0.3, 0.5, -0.8);
const vec3 SUN_COLOR = vec3(1.9, 1.6, 1.0);

float rand(vec2 v) {
    return fract(sin(dot(v ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 calcLights(float a, float d, float s, float e, vec3 ambientColor, vec3 lightColor, vec3 materialColor, vec3 specColor) {
  vec3 color = vec3(1.0);

  //ambient
  ambientColor = ambientColor * a;

  //diffuse
  vec3 norm =  normalize(v_normal) ;
  vec3 lightDir = normalize(LIGHT_DIR);
  float diffuse = max(dot(lightDir, norm), 0.0);
  vec3 diffuseColor = diffuse * d * lightColor;

  //specular
  /*
  vec3 viewDir = normalize(u_cameraPos - v_fragPos);
  vec3 reflectDir = reflect(-lightDir, norm);
  float specular = pow(max(dot(reflectDir, viewDir), 0.0), e);
  vec3 specularColor = specColor * specular * s;
  */

  //bouncing-back light from the sunDir
  float bc = max(dot(norm, normalize(lightDir * vec3(-1.0, 0.0, -1.0))), 0.0);
  vec3 bcColor = bc * ambientColor;

  color = materialColor * (ambientColor + diffuseColor + bcColor);
  return color;
}
vec3 earth() {
  vec3 col = EARTH_BROWN;
  col = mix(EARTH_BROWN, EARTH_DARKBROWN, max(sin(v_fragPos.y*0.5),0.0));
  col = mix(col, EARTH_DARKBROWN, max(sin(v_fragPos.y*0.2),0.0));
  return col;
}
vec3 snow() {
  vec3 snow_color = SNOW_COLOR;
  vec2 v = v_fragPos.xz + v_fragPos.yz;
  if (rand(v) > 0.997) {
    snow_color += 0.8*snow_color*abs(sin(u_time + v.x * v.y));
  }
  return snow_color;
}

void main() {
  if (v_noise < u_clip[0] || v_noise > u_clip[1]) {
    discard;
  }
  float earthLevel = u_terrain[0];
  float snowAmount = 1.0 - u_terrain[1];
  float snowBlur = u_terrain[2];
  float dotN = max(dot(v_normal, vec3(0.0, 1.0, 0.0)), 0.0);
  float lower = max(snowAmount - snowBlur, 0.0);
  float upper = min(snowAmount + snowBlur, snowAmount);
  float f = smoothstep(lower, upper, dotN);

  vec3 terrainColor = mix(earth(), snow(), f) ;
  vec3 outColor = calcLights(1.2, 1.0, 0.0, 0.0, SKY_COLOR, SUN_COLOR, terrainColor, SUN_COLOR);

  outColor = pow(outColor, vec3(1.0 / 2.2));
  gl_FragColor = vec4(outColor, 1.0);
}
`;

var FINAL_VSHADER =
`
  precision mediump float;

  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;
  varying vec2 v_texCoord;
  varying vec3 v_normal;

  void main(){
    gl_Position = a_position;
    v_texCoord = a_texCoord;
    v_normal = a_normal;
  }
`;

var FINAL_FSHADER =
`
precision mediump float;
uniform sampler2D u_sample;
uniform sampler2D u_depth;
uniform float u_near;
uniform float u_far;
uniform float u_fog;
uniform vec3 u_fogColor;
varying vec2 v_texCoord;
varying vec3 v_normal;

float perspectiveDepth() {
  vec4 texDepth = texture2D(u_depth, v_texCoord);
  float depth = texDepth.r;
  float z = depth * 2.0 - 1.0; // Back to NDC
  depth = (2.0 * u_near * u_far) / (u_far + u_near - z * (u_far - u_near));
  depth /= u_far;
  return depth;
}
void main(){
  vec3 texColor = texture2D(u_sample, v_texCoord).rgb;
  float depth = perspectiveDepth();
  //float depth = texture2D(u_depth, v_texCoord).r;
  vec3 fogColor = u_fogColor / 255.0;
  float b = u_fog;
  float fogAmount = 1.0 - exp( -pow(b*depth, 1.5));
  fogAmount = clamp(fogAmount, 0.0, 1.0);
  vec3 color = mix(texColor, fogColor, fogAmount);
  gl_FragColor = vec4(color, 1.0);
}
`;

var CUBEMAP_VSHADER =
`
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec4 v_fragPos;

  void main(){
    v_fragPos = a_position;
    v_normal = a_normal;
    v_texCoord = a_texCoord;
    gl_Position = u_projection * u_view * u_model * a_position;
  }
`;

var CUBEMAP_FSHADER =
`
  precision mediump float;
  uniform samplerCube u_cubemap;
  varying vec4 v_fragPos;
  varying vec2 v_texCoord;
  varying vec3 v_normal;

  void main(){
    vec3 cubeColor = textureCube(u_cubemap, v_fragPos.xyz).rgb;
    gl_FragColor = vec4(cubeColor, 1.0);
  }
`;

var SKYBOX_VSHADER =
  `
  precision mediump float;
  uniform mat4 u_view;
  uniform mat4 u_projection;

  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;

  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec4 v_fragPos;

  void main(){
    v_fragPos = a_position;
    v_normal = a_normal;
    v_texCoord = a_texCoord;
    mat4 rotView = mat4(mat3(u_view));
    vec4 pos = u_projection * rotView * a_position;
    gl_Position = pos.xyww;
  }
  `;

var SKYBOX_FSHADER =
  `
  precision mediump float;
  uniform samplerCube u_cubemap;
  varying vec3 v_normal;
  varying vec4 v_fragPos;
  varying vec2 v_texCoord;

  void main(){
    vec3 sky = textureCube(u_cubemap, v_fragPos.xyz).rgb;
    gl_FragColor = vec4(sky, 1.0);
  }
  `;

  var SKYBOXQUAD_VSHADER =
    `
    precision mediump float;

    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    attribute vec3 a_normal;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec4 v_fragPos;

    void main(){
      v_fragPos = a_position;
      v_fragPos.z = 1.0; // force z to be 1.0 for later transformation
      v_normal = a_normal;
      v_texCoord = a_texCoord;
      gl_Position = a_position;
      gl_Position.z = 1.0;
    }
    `;

  var SKYBOXQUAD_FSHADER =
    `
    #define SUN_COLOR vec3(0.6,0.5,0.2)
    #define SUN_GLOW vec3(0.7,0.4,0.4)
    #define SKY_COLOR vec3(0.5,0.6,0.9)
    #define SUN_DIR vec3(0.0, 0.5, -1.0)

    precision mediump float;
    uniform samplerCube u_cubemap;
    uniform sampler2D u_noisemap;
    uniform float u_time;
    uniform mat4 u_viewProjectInvMatrix;
    varying vec4 v_fragPos;

    float noise(in vec2 uv) {
        return texture2D(u_noisemap, uv/64.0).r;
    }

    float smoothNoise(in vec2 uv) {
        vec2 luv = fract(uv); //range from 0.0 to 1.0
        vec2 id = floor(uv); //the integer part of uv, 0, 1, 2
        luv = luv*luv*(3.0 - 2.0*luv); //similar to smoothstep

        //get values from the cordinates of a square
        float bl = noise(id);
        float br = noise(id + vec2(1.0, 0.0));
        float tl = noise(id + vec2(0.0, 1.0));
        float tr = noise(id + vec2(1.0, 1.0));

        float b = mix(bl, br, luv.x); //interpolate between bl and br
        float t = mix(tl, tr, luv.x); //interpolate between tl and tr

        return mix(b, t, luv.y);
    }

    float fbm4(in vec2 uv) {
        float amp = 0.5;
        float f = 2.0;
        float h = 0.0;
        float a = 0.0;
        for (int i = 0; i < 4; i++){
            h += amp * smoothNoise(uv*f);
            a += amp;
            amp *= 0.5;
            f *= 2.0;
        }

        h /= a;
        return h;
    }

    vec3 calcSky(vec3 skyColor, vec3 cloudColor, vec2 uv) {
        vec3 col = vec3(0.0);
        // speed
        float v = 0.001;
        // layer1
        vec2 scale = uv * 2.0;
        vec2 turbulence = 0.008 * vec2(noise(vec2(uv.x * 10.0, uv.y *10.0)), noise(vec2(uv.x * 10.0, uv.y * 10.0)));
        scale += turbulence;
    	  float n1 = fbm4(uv);

        col = mix( skyColor, cloudColor, smoothstep(0.2, 0.8, n1));
        col = min(col, vec3(1.0));
        return col;
    }

    vec3 skybox() {
      vec4 t = u_viewProjectInvMatrix * v_fragPos;
      vec3 rd = normalize(t.xyz / t.w);
      // A simple way to place some clouds on a distant plane above the terrain -- Based on something IQ uses.
      const float SC = 1e5;
      // Trace out to a distant XZ plane.
      float dist = (SC - 0.0)/rd.y;
      vec2 p = (dist*rd).xz;

      vec3 sunDir = normalize(SUN_DIR);
      float sun = max(dot(sunDir, rd),0.0);
      vec3 skyCol = vec3(0.0);
      vec3 cloudCol = vec3(1.0);

      skyCol += mix(SUN_GLOW, SKY_COLOR, 2.0*abs(rd.y));//horizontal brightness
      skyCol += 0.5*SUN_COLOR*pow(sun, 64.0);
      skyCol += 0.4*SUN_GLOW*pow(sun, 32.0);

      skyCol = calcSky(skyCol, cloudCol, p/SC);
      float grad = smoothstep(0.0, 0.3, rd.y);
      skyCol = mix(SUN_GLOW*vec3(0.4,0.6,0.6), skyCol, grad);

      vec3 texCubemap = textureCube( u_cubemap, rd ).rgb;
      return skyCol;
    }

    void main(){
      gl_FragColor = vec4(skybox(), 1.0);
    }
    `;
