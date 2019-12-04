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
