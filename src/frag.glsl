precision mediump float;

uniform sampler2D u_image;
varying vec4 v_position;
 
void main() {
  vec2 realPosition = (v_position.xy + vec2(1.0)) / vec2(2.0);
  float y = realPosition.y;
  float maxAlpha = 0.0;
  for (int i = 0; i < 300; ++i) {
    float currentAlpha = texture2D(u_image, vec2(float(i) / 300.0, y)).a;
    if (maxAlpha < currentAlpha) {
      maxAlpha = currentAlpha;
    }
  }
  gl_FragColor = vec4(0, 0, 0, maxAlpha);
}