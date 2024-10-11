export const setupPlayPauseButton = (
  playPauseButton,
  render,
  universe,
  gl,
  shaderProgram,
  cellBuffer,
  gridBuffer,
  animationId,
) => {
  const isPaused = () => {
    return window.animationId === null;
  };

  const play = () => {
    playPauseButton.textContent = "⏸";
    render(universe, gl, shaderProgram, cellBuffer, gridBuffer, animationId);
  };

  const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(window.animationId);
    window.animationId = null;
  };

  playPauseButton.addEventListener("click", (_event) => {
    if (isPaused()) {
      play();
    } else {
      pause();
    }
  });
};
