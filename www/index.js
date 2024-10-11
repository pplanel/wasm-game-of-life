import { Universe } from "wasm-game-of-life";
import { render } from "./render.js";
import { initWebGL } from "./webgl.js";
import { setupPlayPauseButton } from "./controls.js";

window.animationId = null;
const universe = Universe.new(1240, 768);
const width = universe.width();
const height = universe.height();

const { gl, shaderProgram, cellBuffer, gridBuffer } = initWebGL(width, height);

const playPauseButton = document.getElementById("play-pause");

setupPlayPauseButton(
  playPauseButton,
  render,
  universe,
  gl,
  shaderProgram,
  cellBuffer,
  gridBuffer,
);
// Start the rendering loop
gl.clearColor(0.1, 0.1, 0.1, 1.0); // Dark gray background
render(universe, gl, shaderProgram, cellBuffer, gridBuffer);
