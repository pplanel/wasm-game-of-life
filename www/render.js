import { drawCells, drawGrid } from "./webgl.js";

// Main render loop
export function render(
  universe,
  gl,
  shaderProgram,
  cellBuffer,
  gridBuffer,
) {
  fps.render();
  universe.tick();
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas
  drawGrid(gl, shaderProgram, gridBuffer, universe.width(), universe.height()); // Draw the grid
  drawCells(
    universe,
    gl,
    shaderProgram,
    cellBuffer,
    universe.width(),
    universe.height(),
  ); // Draw the cells

  window.animationId = requestAnimationFrame(() =>
    render(universe, gl, shaderProgram, cellBuffer, gridBuffer)
  ); // Request the next frame
}
