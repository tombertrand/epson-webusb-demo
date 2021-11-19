const lastPixels = Buffer.from([
  0, 0, 255, 255, 0, 0, 255, 255, 255, 255, 255, 255,
]);
const redPixel = Buffer.from([0, 0, 255, 255]);
// const isValidPaint = Buffer.compare(lastPixel, redPixel) === 0;
const isValidPaint = lastPixels.includes(redPixel);

console.log("~~~~isValidPaint", isValidPaint);
