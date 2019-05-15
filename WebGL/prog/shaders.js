var BASICLIGHTS_VSHADER1 =
  `
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;
  uniform vec3 u_lightColor;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform vec3 u_objectColor;
  attribute vec4 a_position;
  attribute vec3 a_normal;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_fragPos;
  varying vec3 v_lightPos;
  varying vec3 v_objectColor;
  varying vec3 v_cameraPos;
  void main(){
    gl_Position = u_projection * u_view * u_model * a_position;
    v_normal = mat3(u_normalMatrix) * a_normal; //Transform to model space
    v_fragPos = vec3(u_model * a_position); //Transform to model space
    v_lightPos = vec3(u_model * vec4(u_lightPos, 1.0)); //Transform to model space
    v_cameraPos = vec3(u_model * vec4(u_cameraPos, 1.0));
    v_objectColor = u_objectColor;
    v_texCoord = a_texCoord;
  }
  `;

var BASICLIGHTS_FSHADER1 =
  `
  precision mediump float;

  uniform vec3 u_lightColor;
  uniform vec3 u_specularColor;
  uniform sampler2D u_sample;

  varying vec3 v_normal;
  varying vec3 v_fragPos;
  varying vec3 v_lightPos;
  varying vec3 v_cameraPos;
  varying vec2 v_texCoord;
  varying vec3 v_objectColor;
  void main(){
    vec4 texColor = texture2D(u_sample, v_texCoord);

    vec3 normal = normalize(v_normal);
    //calculate ambient light
    vec3 ambientColor = u_lightColor * v_objectColor * 0.3;
    //calculate diffuse light
    vec3 lightDir = normalize(v_lightPos-v_fragPos);
    float nDotL = max(dot(lightDir, normal), 0.0);
    vec3 diffuseColor = v_objectColor * nDotL;
    //calculate specular light
    vec3 viewDir = normalize(v_cameraPos-v_fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(reflectDir, viewDir), 0.0), 64.0);
    vec3 specularColor = u_specularColor * spec * v_objectColor;
    gl_FragColor = vec4(ambientColor + diffuseColor + specularColor , 1.0);

  }
  `;

var TEX_VSHADER1 =
  `
    precision mediump float;
    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;
    uniform mat4 u_normalMatrix;

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
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;

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
uniform sampler2D u_depth;
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

  float hash1( vec2 p )
  {
    p  = 50.0*fract( p*0.3183099 );
    return fract( p.x*p.y*(p.x+p.y) );
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
    float amplitude = 1.0;
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

//Ice blue: 165.0, 242.0, 243.0

const vec3 ICE_BLUE = vec3(165.0, 242.0, 243.0)/256.0;
const vec3 BLUE_SAPPHIRE = vec3(25.0, 100.0, 106.0)/256.0;
const vec3 EARTH_BROWN = vec3(51.0, 26.0, 0.0)/256.0;
const vec3 LIGHT_POSITION = vec3(0.0, 2000.0, -2000.0);
const vec3 AMBIENT_COLOR =  vec3(1.0);
const vec3 DIFFUSE_COLOR = vec3(25.0, 100.0, 106.0)/256.0;
const vec3 SPECULAR_COLOR = vec3(1.0, 1.0, 1.0);
#define LIGHTING_ENABLED 1

float rand(vec2 v){
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
  snow_color *= calcLights(0.7, 0.4, 0.2, 4.0, ICE_BLUE, BLUE_SAPPHIRE, SPECULAR_COLOR);
  vec2 v = v_fragPos.xz;
  if (rand(v) > 0.999) {
    snow_color += abs(sin(u_time + v.x*v.y)) * vec3(1.0);
  }
  return vec4(snow_color, 1.0);
}

vec4 earth() {
  vec3 earth_color = EARTH_BROWN;
  earth_color *= calcLights(0.5, 0.6, 0.2, 2.0, ICE_BLUE, BLUE_SAPPHIRE, SPECULAR_COLOR);
  return vec4(earth_color, 1.0);
}

vec4 water() {
  vec3 water_color = vec3(0.0, 0.06, 0.3) ;
  //water_color *= calcLights(0.1, 0.3, 0.5, 4.0);
  return vec4(water_color, 0.0);
}

void main(){
  float waterLevel = u_terrain[0];
  float earthLevel = u_terrain[1];
  float snowLevel = u_terrain[2];

  if (v_noise < u_clip[0] || v_noise > u_clip[1]) {
    discard;
  }

  vec4 color = vec4(1.0);
  float f = smoothstep(0.24, 0.25, v_normal.y);
  float f1 = smoothstep(-10.0, 10.0, v_fragPos.y);
  color = mix(earth(), snow(), f * f1 ) ;
  if (v_noise < 0.01) {
    color.a = 0.0;
  }
  // color = water() * max(sign(waterLevel - v_noise), 0.0);
  // color = earth() * max(sign(v_noise - earthLevel), 0.0);
  // color = snow() * max(sign(v_noise - snowLevel), 0.0);

  gl_FragColor = color;
}
`;

var BKG_VSHADER = `
  precision mediump float;

  attribute vec4 a_position;
  attribute vec3 a_normal;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  void main() {
    gl_Position = a_position;
    v_texCoord = a_texCoord;
    v_normal = a_normal;
  }
`;

var BKG_FSHADER = `
  precision mediump float;
  uniform sampler2D u_sample;
  uniform vec2 u_mouse;
  uniform float u_time;
  varying vec2 v_texCoord;

  const vec3 GREEN = vec3(20.0, 232.0, 30.0)/255.0;
  const vec3 PURPLE = vec3(141.0, 0.0, 196.0)/255.0;
  const float PI = 3.1415926;
  float hash1( vec2 p )
  {
    p  = 50.0*fract( p*0.3183099 );
    return fract( p.x*p.y*(p.x+p.y) );
  }
  float noised( in vec2 x )
  {
      vec2 p = floor(x);
      vec2 w = fract(x);

      vec2 u = w*w*w*(w*(w*6.0-15.0)+10.0);

      float a = hash1(p+vec2(0,0));
      float b = hash1(p+vec2(1,0));
      float c = hash1(p+vec2(0,1));
      float d = hash1(p+vec2(1,1));

      float k0 = a;
      float k1 = b - a;
      float k2 = c - a;
      float k4 = a - b - c + d;

      return k0 + k1*u.x + k2*u.y + k4*u.x*u.y;
  }

  float stars(vec3 p, float t) {
    float n = abs(noised(p.xy * 50.0));
    n *= pow(n, 100.0);
    t *= 0.1;
    float twinkle = 0.5 + 0.5 * sin( 10.0 * (p.y * 20.0 - t + cos(p.x * 20.0 + t)));
    return n * twinkle * 1.3;
  }

  float fadeout(vec3 p, float speed) {
      return pow(cos(PI * (p.x * 0.3  -1.0)/2.0), speed);
  }

  vec3 rotate(vec3 p, float degree) {

    float x = p.x * cos(degree*PI/180.0) - p.y * sin(degree*PI/180.0);
    float y = p.x * sin(degree*PI/180.0) + p.y * cos(degree*PI/180.0);
    return vec3(x,y,p.z);
  }

  vec3 aurora(vec3 p, float t, float posY, float range, float amplitude, float mixFactor, float fadeOut) {
    vec3 color = vec3(0.0);
    float fact = 0.0;

    float freq = t;
    float thickness = range;
    float x = p.x;
    float y = p.y;
    float amp = amplitude ;
    float pct = 0.0;
    for (float i = 0.0; i < 4.0; i ++) {
        pct += amp * sin(freq * x + i * t * 5.0);
        amp *= 1.0;
        freq *= 1.0;
    }
    //pct +=  0.013 * cos(x * t * 217.33);
    pct *= 0.1;
    pct += posY;

    fact = smoothstep(pct - 0.1, pct, y) - smoothstep( pct , pct + thickness, y);
    color += mix(GREEN, PURPLE, (y - pct) * mixFactor / thickness  ) * fact;
    color *= fadeout(p, fadeOut);
    return color;
  }

  vec3 sky(vec3 p, float t) {
    vec3 skyColor0 = vec3(7.0, 11.0, 52.0)/255.0;
    vec3 skyColor1 = vec3(0.0);
    vec3 sky = mix(skyColor0, skyColor1, p.y + 0.5);
    vec3 star = vec3(stars(p * 10.0 , t));

    vec3 auroraColor = vec3(0.0);
    float r = -180.0 * mod(t * 0.001, 5.0);
    auroraColor += aurora(rotate(p, -30.0 + r), t * 0.01, 0.5, 0.5, 0.5, 1.2, 1.5);
    auroraColor +=  aurora(rotate(p, -25.0 + r), t * 0.01, 0.2, 0.2, 0.2, 1.8, 1.5);
    auroraColor +=   aurora(rotate(p, 5.0 + r), t * 0.03, 0.3, 0.2, 0.1, 0.5, 1.5);

    return sky + star + auroraColor ;
  }
  void main() {
    vec4 texColor = texture2D(u_sample, v_texCoord);
    vec2 uv = v_texCoord;
    uv += 0.0;
    uv += u_mouse * 0.1 * vec2(1.0, -1.0) ; // scaling
    //define camera
    vec3 ro = vec3(0.0, 0.0, 0.0); // origin
    vec3 lookAt = vec3(0.0, 0.0, -1.0); // target
    float zoom = 1.0;
    vec3 fwd = normalize(lookAt - ro);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(fwd, worldUp)); // right-hand rule
    vec3 up = normalize(cross(right, fwd));
    vec3 c = ro + fwd * zoom; // center of the view plane
    vec3 i = c + uv.x * right + uv.y * up; // intersection point on the view plane

    vec3 rd = normalize(i - ro); // ray direction

   	vec3 color = sky(i, u_time);
    gl_FragColor = vec4(color, 1.0);
  }
`;

var FINAL_VSHADER =
`
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;

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
uniform sampler2D u_reflect;
uniform sampler2D u_refract;
varying vec2 v_texCoord;
varying vec3 v_normal;

void main(){
  vec4 texColor = texture2D(u_sample, v_texCoord);
  vec4 texReflect = texture2D(u_reflect, v_texCoord);
  vec4 texRefract = texture2D(u_refract, v_texCoord);

  vec3 color = texColor.rgb;
  if (texColor.a == 0.0) {
    color = texReflect.rgb;
  }
  gl_FragColor = vec4(color.rgb, 1.0);

}
`;
