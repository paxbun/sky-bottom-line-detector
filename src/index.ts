import vert from "./vert.glsl";
import frag from "./frag.glsl";

const input = document.getElementById("input")! as HTMLCanvasElement;
const inputCtx = input.getContext("2d")!;
input.addEventListener("mousedown", (event) => {
  inputCtx.strokeStyle = "#000000";
  inputCtx.lineWidth = 2;

  let currentMouseX = event.offsetX;
  let currentMouseY = event.offsetY;
  inputCtx.beginPath();
  inputCtx.moveTo(currentMouseX, currentMouseY);

  function mouseMoveHandler(event: MouseEvent) {
    let newMouseX = currentMouseX + event.movementX;
    let newMouseY = currentMouseY + event.movementY;
    inputCtx.lineTo(newMouseX, newMouseY);
    inputCtx.stroke();
    currentMouseX = newMouseX;
    currentMouseY = newMouseY;
    inputCtx.beginPath();
    inputCtx.moveTo(currentMouseX, currentMouseY);
  }

  window.addEventListener("mousemove", mouseMoveHandler);
  window.addEventListener(
    "mouseup",
    () => {
      presentSkyBottomLine();
      window.removeEventListener("mousemove", mouseMoveHandler);
    },
    { once: true }
  );
});

const output = document.getElementById("output")! as HTMLCanvasElement;
const outputCtx = output.getContext("2d")!;

function presentSkyBottomLine() {
  outputCtx.clearRect(0, 0, output.width, output.height);
  outputCtx.drawImage(input, 0, 0);

  function drawPixel(x: number, y: number, color: string) {
    outputCtx.fillStyle = color;
    outputCtx.fillRect(x - 1, y - 1, 2, 2);
  }

  const [skyLine, bottomLine] = getSkyBottomLine();
  for (let x = 0; x < input.width; ++x) {
    drawPixel(x, skyLine[x], "#ff0000");
    drawPixel(x, bottomLine[x], "#0000ff");
  }
}

// const glCanvas = document.createElement("canvas");
// glCanvas.width = input.width;
// glCanvas.height = 1;
const glCanvas = document.getElementById("glCanvas")! as HTMLCanvasElement;
const gl = glCanvas.getContext("webgl")!;
if (!gl) {
  throw new Error("No WebGL support");
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vert)!;
if (!vertexShader) {
  throw new Error("WebGL initialization failed");
}

const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, frag)!;
if (!fragmentShader) {
  throw new Error("WebGL initialization failed");
}

const program = createProgram(gl, vertexShader, fragmentShader)!;
if (!program) {
  throw new Error("WebGL initialization failed");
}

const texture = gl.createTexture();
if (!texture) {
  throw new Error("WebGL initialization failed");
}

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
var positions = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, -1],
  [1, 1],
  [-1, 1],
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions.flat()), gl.STATIC_DRAW);
gl.viewport(0, 0, glCanvas.width, glCanvas.height);
gl.useProgram(program);
gl.enableVertexAttribArray(positionAttributeLocation);

gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

function getSkyBottomLine(): [number[], number[]] {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(
    positionAttributeLocation,
    2, // 2 components per iteration
    gl.FLOAT,
    false, // no normalization
    0, // stride = 0
    0 // offset = 0
  );
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  const pixels = new Uint8Array(glCanvas.width * 4);
  gl.readPixels(0, 0, glCanvas.width, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  const skyLine: number[] = [];
  const bottomLine: number[] = [];
  for (let i = 0; i < glCanvas.width; ++i) {
    skyLine.push(pixels[i * 4 + 0] / 255 * input.height);
    bottomLine.push(pixels[i * 4 + 1] / 255 * input.height);
  }

  return [skyLine, bottomLine];
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Could not create a shader");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation failed\n" + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    console.error("Could not create a program");
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link failed\n" + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
