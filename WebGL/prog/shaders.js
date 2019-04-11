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
    gl_Position = u_projection * u_view * u_model * a_position;
    v_texCoord = a_texCoord;
    v_normal = a_normal;
  }
`;

var CUSTOM_FSHADER1 =
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

var TERRAIN_VSHADER1 =
`
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform mat4 u_normalMatrix;
  uniform float u_displacement;

  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  attribute vec3 a_normal;
  varying vec2 v_texCoord;
  varying vec4 v_position;
  varying float v_noise;

  const int OCTAVES = 8;
  float applyCurve(float x) {
    return 1.0 - pow(abs(x), 2.5);
  }

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

  float noise(vec2 v, float persistance, float lacunarity) {
    float freq = 1.0;
    float amplitude = 1.0;
    float noise_value = 0.0;
    for (int i = 0; i < OCTAVES; i ++) {
      float sample_x = freq * v.x;
      float sample_y = freq * v.y;
      noise_value += amplitude * snoise(vec2(sample_x, sample_y));
      amplitude *= persistance;
      freq *= lacunarity;
    }
    noise_value = pow(noise_value, 0.8);
    return noise_value;
  }

  void main(){
    vec4 world_pos = u_model * a_position;
    float noise_value = noise(world_pos.xz * 0.01, 0.5, 2.0);
    vec3 new_position = world_pos.xyz + a_normal * u_displacement * noise_value;
    gl_Position = u_projection * u_view * vec4(new_position, 1.0);
    v_position = gl_Position;
    v_noise = noise_value;
    v_texCoord = a_texCoord;
  }
`;

var TERRAIN_FSHADER1 =
`
precision mediump float;
uniform float u_seaLevel;
varying vec2 v_texCoord;
varying vec4 v_position;
varying float v_noise;

void main(){
  vec3 color = vec3(0.0);
  if (v_noise > u_seaLevel) {
    color = vec3(v_noise);
  } else {
    color = vec3(0.0, 1.0, 1.0) * v_noise;
  }
  gl_FragColor = vec4(color, 1.0);

}
`;
