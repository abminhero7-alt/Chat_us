// Generate valid PNG icons using a reliable approach
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createIcon(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // 8-bit
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // no filter
  ihdrData[12] = 0; // no interlace
  
  // Pixel data
  const cx = size / 2, cy = size / 2;
  const r = size * 0.42;
  const corner = size * 0.18;
  const hw = size / 2 - corner, hh = size / 2 - corner;
  
  const pixels = [];
  for (let y = 0; y < size; y++) {
    pixels.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      
      // Rounded rect check
      const clampedX = Math.max(-hw, Math.min(hw, dx));
      const clampedY = Math.max(-hh, Math.min(hh, dy));
      const rectDist = Math.sqrt(clampedX * clampedX + clampedY * clampedY);
      
      // Tail
      const tailDist = Math.sqrt((x - (cx - size * 0.25)) ** 2 + (y - (cy + size * 0.35)) ** 2);
      const inTail = tailDist < size * 0.1 && dy > size * 0.15;
      
      // C letter
      const cDist = Math.sqrt((dx + size * 0.05) ** 2 + dy ** 2);
      const inC = cDist < size * 0.22 && cDist > size * 0.12 && dx < -size * 0.02;
      
      // Small bubble
      const bDist = Math.sqrt((dx - size * 0.18) ** 2 + (dy + size * 0.15) ** 2);
      const inB = bDist < size * 0.12;
      
      if (rectDist > corner && !inTail) {
        pixels.push(0, 0, 0, 0); // transparent
      } else if (inC || inB) {
        pixels.push(255, 255, 255, 255); // white
      } else {
        const t = dy / size + 0.5;
        pixels.push(
          Math.round(37 - t * 10),
          Math.round(99 + t * 10),
          Math.round(235 - t * 20),
          255
        );
      }
    }
  }
  
  const raw = Buffer.from(pixels);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const dir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

[192, 512].forEach(size => {
  const png = createIcon(size);
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png);
  console.log(`icon-${size}.png: ${png.length} bytes`);
});

console.log('Icons generated!');
