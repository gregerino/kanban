const cache = new Map();

export function loadSpriteSheet(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load sprite: ${path}`));
    img.src = path;
  });
  cache.set(path, promise);
  return promise;
}

export function drawCell(ctx, image, col, row, cellSize = 64) {
  ctx.drawImage(image, col * cellSize, row * cellSize, cellSize, cellSize, 0, 0, cellSize, cellSize);
}

export function preloadSheets(paths) {
  return Promise.all(paths.map(loadSpriteSheet));
}
