const cutPaper = Buffer.concat([
  // CTL VT
  Buffer.from([0x0b]),
  // PAPER PARTIAL CUT
  Buffer.from([0x1b, 0x64, 0x03]),
]);

function printImageBuffer(width, height, data) {
  let buffer = Buffer.from([]);
  // Get pixel rgba in 2D array
  var pixels = [];
  for (var i = 0; i < height; i++) {
    var line = [];
    for (var j = 0; j < width; j++) {
      var idx = (width * i + j) << 2;
      line.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
        a: data[idx + 3],
      });
    }
    pixels.push(line);
  }

  buffer = Buffer.concat([buffer, Buffer.from([0x1b, 0x30])]);

  // v3
  for (var i = 0; i < Math.ceil(height / 24); i++) {
    var imageBuffer = Buffer.from([]);
    for (var y = 0; y < 24; y++) {
      for (var j = 0; j < Math.ceil(width / 8); j++) {
        var byte = 0x0;
        for (var x = 0; x < 8; x++) {
          if (
            i * 24 + y < pixels.length &&
            j * 8 + x < pixels[i * 24 + y].length
          ) {
            var pixel = pixels[i * 24 + y][j * 8 + x];
            if (pixel.a > 126) {
              // checking transparency
              var grayscale = parseInt(
                0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b
              );

              if (grayscale < 128) {
                // checking color
                var mask = 1 << (7 - x); // setting bitwise mask
                byte |= mask; // setting the correct bit to 1
              }
            }
          }
        }
        imageBuffer = Buffer.concat([imageBuffer, Buffer.from([byte])]);
      }
    }
    console.log("~~~imageBuffer.length", imageBuffer.length);
    console.log("~~~/24", parseInt(imageBuffer.length / 24));
    buffer = Buffer.concat([
      buffer,
      Buffer.from([0x1b, 0x6b, parseInt(imageBuffer.length / 24), 0x00]),
    ]);
    console.log("~~~imageBuffer", imageBuffer);
    buffer = Buffer.concat([buffer, imageBuffer]);
    buffer = Buffer.concat([buffer, Buffer.from("\n")]);
  }

  buffer = Buffer.concat([buffer, Buffer.from([0x1b, 0x7a, 0x01])]);
  buffer = Buffer.concat([buffer, cutPaper]);

  return buffer;
}

function getStarImageBuffer() {
  let fs = require("fs");
  let PNG = require("pngjs").PNG;
  try {
    var data = fs.readFileSync("lightspeed-logo.png");
    var png = PNG.sync.read(data);
    console.log("~~~~png", png);
    let buffer = printImageBuffer(png.width, png.height, png.data);
    console.log("~~~~buffer", buffer);
    fs.writeFileSync("buffer", buffer);
    return buffer;
  } catch (error) {
    throw error;
  }
}

getStarImageBuffer();
