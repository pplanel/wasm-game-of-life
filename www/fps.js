const fps = new class {
  constructor() {
    this.fps = document.getElementById("fps");
    this.frames = [];
    this.lastFrameTimeStamp = performance.now();
  }

  render() {
    // Convert the delta time since the last frame render into a measure
    // of frames per second.
    const now = performance.now();
    const delta = now - this.lastFrameTimeStamp;
    this.lastFrameTimeStamp = now;
    const fps = 1 / delta * 1000;

    // Save only the latest 100 timings.
    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    // Find the max, min, and mean of our 100 latest timings.
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }
    const mean = sum / this.frames.length;

    const latestFpsCell = document.getElementById("latest-fps");
    const avgFpsCell = document.getElementById("avg-fps");
    const minFpsCell = document.getElementById("min-fps");
    const maxFpsCell = document.getElementById("max-fps");

    latestFpsCell.textContent = Math.round(fps);
    avgFpsCell.textContent = Math.round(mean);
    minFpsCell.textContent = Math.round(min);
    maxFpsCell.textContent = Math.round(max);
    // Render the statistics.
  }
}();
