//
// import { Universe } from "wasm-game-of-life";
// import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
//
// const universe = Universe.new(1200, 600);
// const width = universe.width();
// const height = universe.height();
//
// const canvas = document.getElementById("game-of-life-canvas");
// const gl = canvas.getContext("webgl2"); // Use WebGL 2.0
//
// if (!gl) {
//   console.error("WebGL 2.0 is not supported by your browser");
// }
//
// // Set canvas width and height
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
// gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Set viewport
//
// // Initialize WebGL shaders and buffers
// const vertexShaderSource = `
//     attribute vec2 a_position;
//     varying vec2 v_texCoord;
//
//     void main() {
//         gl_Position = vec4(a_position, 0, 1);
//         v_texCoord = a_position * 0.5 + 0.5; // Convert [-1,1] to [0,1] for texture
//     }
// `;
//
// const fragmentShaderSource = `
//     precision mediump float;
//     varying vec2 v_texCoord;
//     uniform sampler2D u_texture;
//
//     void main() {
//         vec4 cellState = texture2D(u_texture, v_texCoord);
//         if (cellState.r > 0.5) {
//             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black for live cells
//         } else {
//             gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White for dead cells
//         }
//     }
// `;
//
// // Function to initialize shaders
// function initShaderProgram(gl, vsSource, fsSource) {
//   const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
//   const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
//
//   const shaderProgram = gl.createProgram();
//   gl.attachShader(shaderProgram, vertexShader);
//   gl.attachShader(shaderProgram, fragmentShader);
//   gl.linkProgram(shaderProgram);
//
//   if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
//     console.error(
//       "Unable to initialize the shader program:",
//       gl.getProgramInfoLog(shaderProgram),
//     );
//     return null;
//   }
//   return shaderProgram;
// }
//
// // Function to load a shader
// function loadShader(gl, type, source) {
//   const shader = gl.createShader(type);
//   gl.shaderSource(shader, source);
//   gl.compileShader(shader);
//
//   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//     console.error(
//       "An error occurred compiling the shaders:",
//       gl.getShaderInfoLog(shader),
//     );
//     gl.deleteShader(shader);
//     return null;
//   }
//   return shader;
// }
//
// // Initialize shader program
// const shaderProgram = initShaderProgram(
//   gl,
//   vertexShaderSource,
//   fragmentShaderSource,
// );
//
// // Create texture for universe state
// const universeTexture = gl.createTexture();
// gl.bindTexture(gl.TEXTURE_2D, universeTexture);
//
// // Set up texture parameters
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//
// // Vertex positions for the full-screen quad
// const vertices = new Float32Array([
//   -1.0,
//   -1.0,
//   1.0,
//   -1.0,
//   -1.0,
//   1.0,
//   1.0,
//   1.0,
// ]);
//
// const vertexBuffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
//
// const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
// gl.enableVertexAttribArray(positionLocation);
// gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
//
// // Function to check if a bit is set
// const bitIsSet = (n, arr) => {
//   const byte = Math.floor(n / 8);
//   const mask = 1 << (n % 8);
//   return (arr[byte] & mask) === mask;
// };
//
// // Function to update the universe texture
// const updateUniverseTexture = () => {
//   const cellsPtr = universe.cells();
//   const cellsSize = width * height / 8;
//   const cells = new Uint8Array(memory.buffer, cellsPtr, cellsSize);
//
//   // Convert the cell data to a texture-ready format (RGBA)
//   const textureData = new Uint8Array(width * height * 4);
//   for (let idx = 0; idx < width * height; idx++) {
//     const isAlive = bitIsSet(idx, cells);
//     const offset = idx * 4;
//     textureData[offset] = isAlive ? 255 : 0; // Red channel
//     textureData[offset + 1] = 0; // Green channel
//     textureData[offset + 2] = 0; // Blue channel
//     textureData[offset + 3] = 255; // Alpha channel
//   }
//
//   // Bind the texture and upload the new data
//   gl.bindTexture(gl.TEXTURE_2D, universeTexture);
//   gl.texImage2D(
//     gl.TEXTURE_2D,
//     0,
//     gl.RGBA,
//     width,
//     height,
//     0,
//     gl.RGBA,
//     gl.UNSIGNED_BYTE,
//     textureData,
//   );
// };
//
// // Main render loop
// function render() {
//   fps.render();
//   universe.tick();
//   gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas
//
//   // Update the universe texture with the latest cell states
//   updateUniverseTexture();
//
//   // Use the shader program for rendering
//   gl.useProgram(shaderProgram);
//
//   // Bind the universe texture
//   const textureLocation = gl.getUniformLocation(shaderProgram, "u_texture");
//   gl.activeTexture(gl.TEXTURE0);
//   gl.bindTexture(gl.TEXTURE_2D, universeTexture);
//   gl.uniform1i(textureLocation, 0);
//
//   // Draw the cells (full screen quad covering the universe area)
//   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the quad
//
//   // Request the next frame
//   requestAnimationFrame(render);
// }
//
// gl.clearColor(1.0, 1.0, 1.0, 1.0); // Set the background color to white
// render();
