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

#ifdef CALC_NORM
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

const vec3 ICE_BLUE = vec3(165.0, 242.0, 243.0)/256.0;
const vec3 BLUE_SAPPHIRE = vec3(25.0, 100.0, 106.0)/256.0;
const vec3 EARTH_BROWN = vec3(0.1, 0.08, 0.05);
const vec3 LIGHT_POSITION = vec3(0.0, 2000.0, -2000.0);
const vec3 AMBIENT_COLOR =  vec3(1.0);
const vec3 DIFFUSE_COLOR = vec3(1.0, 1.0, 0.7);
const vec3 SPECULAR_COLOR = ICE_BLUE; //vec3(1.0, 1.0, 1.0);
#define LIGHTING_ENABLED 1

float rand(vec2 v) {
    return fract(sin(dot(v ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 calcLights(float a, float d, float s, float e, in vec3 ambColor, in vec3 diffColor, in vec3 specColor) {
  vec3 color = vec3(1.0);

#ifdef LIGHTING_ENABLED
    vec3 normalRandom = 0.3*fract(vec3(rand(v_fragPos.xy), rand(v_fragPos.yx), rand(v_fragPos.zx)));
    //ambient
    vec3 ambientColor = ambColor * a;

    //diffuse
    vec3 norm =  normalize(v_normal + normalRandom) ;
    vec3 lightDir = normalize(LIGHT_POSITION - v_fragPos);
    float diffuse = max(dot(lightDir, norm), 0.0);
    vec3 diffuseColor = diffColor * diffuse * d;

    //specular
    vec3 viewDir = normalize(u_cameraPos - v_fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float specular = pow(max(dot(reflectDir, viewDir), 0.0), e);
    vec3 specularColor = specColor * specular * s;
    color = ambientColor + diffuseColor + specularColor;
#endif
  return color;
}

vec4 snow() {
  vec3 snow_color = ICE_BLUE;
  snow_color *= calcLights(0.7, 0.4, 0.2, 4.0, AMBIENT_COLOR, DIFFUSE_COLOR, SPECULAR_COLOR);
  vec2 v = v_fragPos.xz;
  if (rand(v) > 0.999) {
    snow_color += abs(sin(u_time + v.x*v.y)) * vec3(1.0);
  }
  return vec4(snow_color, 1.0);
}

vec4 earth() {
  vec3 earth_color = EARTH_BROWN;
  earth_color *= calcLights(0.5, 0.8, 0.2, 2.0, AMBIENT_COLOR, DIFFUSE_COLOR, SPECULAR_COLOR);
  return vec4(earth_color, 1.0);
}

void main(){
  float waterLevel = u_terrain[0];
  float earthLevel = u_terrain[1];
  float snowLevel = u_terrain[2];

  if (v_noise < u_clip[0] || v_noise > u_clip[1]) {
    discard;
  }

  vec4 color = vec4(1.0);
  float f = smoothstep(0.34, 0.45, v_normal.y);
  float f1 = smoothstep(-10.0, 10.0, v_fragPos.y);
  color = mix(earth(), snow(), f * f1 ) ;

  // color = water() * max(sign(waterLevel - v_noise), 0.0);
  // color = earth() * max(sign(v_noise - earthLevel), 0.0);
  // color = snow() * max(sign(v_noise - snowLevel), 0.0);
  color.rgb += 0.05 * vec3(1.0, 0.0, 0.0);
  color.rgb = pow(color.rgb, vec3(1.0 / 2.2));
  gl_FragColor = color;
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
varying vec2 v_texCoord;
varying vec3 v_normal;

void main(){
  vec4 texColor = texture2D(u_sample, v_texCoord);
  vec4 texDepth = texture2D(u_depth, v_texCoord);
  vec3 color = texColor.rgb;
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
    precision mediump float;
    uniform samplerCube u_cubemap;
    uniform float u_time;
    uniform mat4 u_viewProjectInvMatrix;

    varying vec4 v_fragPos;
    //noise function from iq: https://www.shadertoy.com/view/Msf3WH
    vec2 hash( vec2 p )
    {
    	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
    	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }

    float noise( in vec2 p )
    {
        const float K1 = 0.366025404; // (sqrt(3)-1)/2;
        const float K2 = 0.211324865; // (3-sqrt(3))/6;

    	vec2  i = floor( p + (p.x+p.y)*K1 );
        vec2  a = p - i + (i.x+i.y)*K2;
        float m = step(a.y,a.x);
        vec2  o = vec2(m,1.0-m);
        vec2  b = a - o + K2;
    	vec2  c = a - 1.0 + 2.0*K2;
        vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
    	vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
        return dot( n, vec3(70.0) );
    }

    const mat2 m2 = mat2(1.6,  1.2, -1.2,  1.6);

    float fbm4(vec2 p) {
        float amp = 0.5;
        float h = 0.0;
        for (int i = 0; i < 4; i++) {
            float n = noise(p);
            h += amp * n;
            amp *= 0.5;
            p = m2 * p ;
        }

    	return  0.5 + 0.5*h;
    }
    vec3 calcSky(vec3 p) {
      vec3 sky = vec3(0.5, 0.7, 0.8);
      vec3 col = vec3(0.0);

      // speed
      float v = 0.001;

      // layer1
      vec3 cloudCol = vec3(1.0);
      vec2 uv = p.xy;

      vec2 scale = uv * 5.0;
      vec2 turbulence = 0.008 * vec2(noise(vec2(uv.x * 10.0, uv.y *10.0)), noise(vec2(uv.x * 10.0, uv.y * 10.0)));
      scale += turbulence;
  	  float n1 = fbm4(vec2(scale.x - 20.0 * sin(u_time * v * 2.0), scale.y - 50.0 * sin(u_time * v)));
      //float n1 = fbm4(vec2(scale.x - 20.0, scale.y - 50.0));
      col = mix( sky, cloudCol, smoothstep(0.5, 0.8, n1));

      //layer2
      scale = uv * 0.5;
      turbulence = 0.05 * vec2(noise(vec2(uv.x * 2.0, uv.y * 2.1)), noise(vec2(uv.x * 1.5, uv.y * 1.2)));
      scale += turbulence;
      //float n2 = fbm4(scale + 20.0);
      float n2 = fbm4(scale + 20.0 * sin(u_time * v ));
      col =  mix( col, cloudCol, smoothstep(0.2, 0.9, n2));
      col = min(col, vec3(1.0));
      return col;
    }

    vec3 skybox() {
      vec4 t = u_viewProjectInvMatrix * v_fragPos;
      vec3 dir = normalize(t.xyz / t.w);
      vec3 texCubemap = textureCube( u_cubemap, dir ).rgb;
      vec3 sky = calcSky(dir);
      return sky;
    }
    void main(){
      gl_FragColor = vec4(skybox(), 1.0);
    }
    `;
