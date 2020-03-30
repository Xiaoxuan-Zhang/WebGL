var PARTICLES_UPDATE_VSHADER =
`#version 300 es
  #define PI 3.1415926

  precision mediump float;
  uniform float u_timeDelta;
  uniform sampler2D u_randomTex;
  uniform sampler2D u_noiseTex;
  uniform vec2 u_move;
  uniform vec2 u_origin;
  uniform vec4 u_params; //(u_minTheta, u_maxTheta, u_minSpeed, u_maxSpeed)

  in vec3 i_position;
  in float i_age;
  in float i_lifeSpan;
  in vec3 i_velocity;

  out vec3 o_position;
  out float o_age;
  out float o_lifeSpan;
  out vec3 o_velocity;

  void main(void) {
    vec3 gradNoise = texture(u_noiseTex, i_position.xy).rgb;
    if (i_age > i_lifeSpan) {
      //generate new position
      ivec2 rndCoord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
      vec3 rnd = texelFetch(u_randomTex, rndCoord, 0).rgb;
      float minTheta = u_params.x * PI / 180.0;
      float maxTheta = u_params.y * PI / 180.0;
      float theta = minTheta + rnd.r * (maxTheta - minTheta);
      float theta1 = minTheta + rnd.g * (maxTheta - minTheta);
      //movement direction x y
      float x = cos(theta);
      float y = sin(theta);
      float z = cos(theta1);
      vec3 org = rnd * 2.0 - 1.0;
      o_position = vec3(org.x * 100.0, 50.0 + rnd.y * 50.0, org.z * 100.0) ;
      //o_position = vec3(0.0, 10.0, 0.0);
      o_age = 0.0;
      o_lifeSpan = i_lifeSpan;
      float minSpeed = u_params.z;
      float maxSpeed = u_params.w;
      o_velocity = vec3(x, y, z) * (minSpeed + rnd.b * (maxSpeed - minSpeed));
    } else {
      float forceAmp = u_move.x;
      vec3 gravitDir = vec3(0.0, u_move.y, 0.0);
      vec3 forceDir = forceAmp * (2.0 * gradNoise - 1.0);
      o_position = i_position + i_velocity * u_timeDelta;
      o_age = i_age + u_timeDelta;
      o_lifeSpan = i_lifeSpan;
      o_velocity = i_velocity + (forceDir + gravitDir) * u_timeDelta;
    }
  }
`;
var PARTICLES_UPDATE_FSHADER =
`#version 300 es

  void main() {
    discard;
  }
`;
var PARTICLES_RENDER_VSHADER =
`#version 300 es
  precision mediump float;

  in vec3 i_position;
  in float i_age;
  in float i_lifeSpan;
  in vec3 i_velocity;

  out float o_age;
  out vec3 o_velocity;
  out vec3 o_position;

  void main() {
    o_age = i_age / i_lifeSpan;
    o_position = i_position;
    gl_PointSize = 1.0 + 4.0 * (1.0 - o_age);
    gl_Position = vec4(i_position, 1.0);
  }
`;

var PARTICLES_RENDER_FSHADER =
`#version 300 es
  precision mediump float;
  in float o_age;
  in vec3 o_velocity;
  in vec3 o_position;

  out vec4 o_fragColor;
  /* From http://iquilezles.org/www/articles/palettes/palettes.htm */
  vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
  }
  void main() {
    vec3 col = palette(o_age,
                      vec3(0.5,0.5,0.5),
                      vec3(0.5,0.5,0.5),
                      vec3(1.0,0.7,0.4),
                      vec3(0.0,0.15,0.20));
    o_fragColor = vec4(col, 1.0 - o_age);
  }
`;

var PARTICLES_RENDER_QUAD_VSHADER =
`#version 300 es
  precision mediump float;
  uniform mat4 u_model;
  uniform mat4 u_view;
  uniform mat4 u_projection;
  uniform float u_spriteScale;

  //per instance
  in vec3 i_position;
  in float i_age;
  in float i_lifeSpan;
  in vec3 i_velocity;

  //per vertex
  in vec2 i_coord;
  in vec2 i_texCoord;

  out float o_age;
  out vec3 o_velocity;
  out vec3 o_position;
  out vec2 o_texCoord;

  void main() {

    o_velocity = i_velocity;
    o_age = i_age / i_lifeSpan;

    /*
    set the rotation part of model matrix to be
    the transpose of the rotation part of viewMatrix.
    This equals to the identity matrix, canceling out the rotation part.
    */
    //mat4 modelViewMatrix = u_view * u_model;
    // modelViewMatrix[0][0] = 1.0;
    // modelViewMatrix[0][1] = 0.0;
    // modelViewMatrix[0][2] = 0.0;
    //
    // // Second colunm.
    // modelViewMatrix[1][0] = 0.0;
    // modelViewMatrix[1][1] = 1.0;
    // modelViewMatrix[1][2] = 0.0;
    //
    // // Thrid colunm.
    // modelViewMatrix[2][0] = 0.0;
    // modelViewMatrix[2][1] = 0.0;
    // modelViewMatrix[2][2] = 1.0;

    //vec3 vertPos = i_position + (scale * (1.0 - o_age) + 0.5) * vec3(i_coord, 0.0) * 2.0;
    //vec4 oPos = u_projection * modelViewMatrix * vec4(vertPos, 1.0);

    //http://www.opengl-tutorial.org/intermediate-tutorials/billboards-particles/billboards/
    float agingScale = 0.5;
    vec2 vertOffset = (1.0 - agingScale * o_age) * i_coord * u_spriteScale;
    vec3 camRightWorld = vec3(u_view[0][0], u_view[1][0], u_view[2][0]);
    vec3 camUpWorld = vec3(u_view[0][1], u_view[1][1], u_view[2][1]);
    vec4 vertWorld = u_model * vec4(i_position, 1.0);
    vec3 vertPos = vertWorld.xyz
                  + vertOffset.x * camRightWorld
                  + vertOffset.y * camUpWorld;
    vec4 oPos = u_projection  * u_view * vec4(vertPos, 1.0);
    o_position = vertPos;
    gl_Position = oPos;
    gl_Position.w = gl_Position.z; //always in front
    o_texCoord = i_texCoord;
  }
`;

var PARTICLES_RENDER_QUAD_FSHADER =
`#version 300 es
  precision mediump float;
  uniform sampler2D u_spriteTex;
  in float o_age;
  in vec3 o_velocity;
  in vec3 o_position;
  in vec2 o_texCoord;

  out vec4 o_fragColor;

  void main() {
    vec4 texCol = texture(u_spriteTex, o_texCoord);
    vec4 mask = vec4(vec3(1.2), 1.0 - o_age);
    o_fragColor = texCol * mask;
  }
`;
