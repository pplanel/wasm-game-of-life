import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        gl_PointSize = 1.0; // Size of each cell
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color; // Color of the cell
    }
`;

// Function to initialize shaders
export function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program:",
      gl.getProgramInfoLog(shaderProgram),
    );
    return null;
  }
  return shaderProgram;
}

// Function to load a shader
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders:",
      gl.getShaderInfoLog(shader),
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// Function to initialize WebGL
export function initWebGL(width, height) {
  const canvas = document.getElementById("game-of-life-canvas");
  const gl = canvas.getContext("webgl2");

  canvas.width = width; // Set canvas width
  canvas.height = height; // Set canvas height
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set viewport

  const shaderProgram = initShaderProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource,
  );

  // Separate buffers for the grid and cells
  const cellBuffer = gl.createBuffer();
  const gridBuffer = gl.createBuffer();

  return { gl, shaderProgram, cellBuffer, gridBuffer };
}

// Function to draw cells using WebGL
export const drawCells = (
  universe,
  gl,
  shaderProgram,
  cellBuffer,
  width,
  height,
) => {
  const cellsPtr = universe.cells();
  const cellsSize = width * height / 8;
  const cells = new Uint8Array(memory.buffer, cellsPtr, cellsSize);

  gl.useProgram(shaderProgram);

  // Prepare vertex positions based on cell states
  const positions = [];

  for (let idx = 0; idx < width * height; idx++) {
    const [row, col] = [idx / width, idx % width];

    if (bitIsSet(idx, cells)) {
      positions.push((col / width) * 2 - 1); // Normalize to [-1, 1]
      positions.push((row / height) * 2 - 1); // Normalize to [-1, 1]
    }
  }

  // Bind position buffer and set attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, cellBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

  // Get the attribute location, enable it
  const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  // Set the color uniform
  const colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
  gl.uniform4f(colorLocation, 0.3, 0.9, 0.3, 1.0); // Bright green for cells
  gl.drawArraysInstanced(gl.POINTS, 0, positions.length / 2, 1);
};

// Function to draw the grid using WebGL
export const drawGrid = (gl, shaderProgram, gridBuffer, width, height) => {
  // Use the shader program for drawing the grid
  gl.useProgram(shaderProgram);

  const gridPositions = [];

  // Calculate the positions for vertical lines
  for (let col = 0; col < width; col++) {
    const x = (col / width) * 2 - 1; // Normalize to [-1, 1]
    gridPositions.push(x, -1); // Start from bottom
    gridPositions.push(x, 1); // End at top
  }

  // Calculate the positions for horizontal lines
  for (let row = 0; row < height; row++) {
    const y = (row / height) * 2 - 1; // Normalize to [-1, 1]
    gridPositions.push(-1, y); // Start from left
    gridPositions.push(1, y); // End at right
  }

  // Create a buffer for the grid lines
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(gridPositions),
    gl.STATIC_DRAW,
  );

  // Set the attribute for the grid lines
  const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // Set the color for the grid lines
  const colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
  gl.uniform4f(colorLocation, 0.1, 0.1, 0.1, 0.2); // Light gray color for the grid

  // Draw the grid lines
  gl.drawArrays(gl.LINES, 0, gridPositions.length / 2);
};

// Helper function to check if a bit is set
const bitIsSet = (n, arr) => {
  const byte = Math.floor(n / 8);
  const mask = 1 << (n % 8);
  return (arr[byte] & mask) === mask;
};
