// Generates public/icons/icon.svg and PNG icons (192, 512, 512 maskable) from the circuit-compass pixel map. No dependencies.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "public", "icons");
fs.mkdirSync(OUT, { recursive: true });

const MAP = Array.from({length:24},(_,y)=>Array.from({length:24},(_,x)=>{
  const distance=Math.abs(x-11.5)+Math.abs(y-11.5);
  if(y<4 && Math.abs(x-11.5)<1.6)return 'G';
  if((x<4||x>19)&&Math.abs(y-11.5)<1.6)return 'M';
  if(distance>10&&distance<12)return 'M';
  if(y>=7&&y<=16&&(Math.abs(x-(11.5-(y-7)*.48))<.9||Math.abs(x-(11.5+(y-7)*.48))<.9))return 'W';
  if(y===13&&x>=9&&x<=14)return 'W';
  return '.';
}).join(''));
const COLORS={M:'#8aead5',W:'#fff8e9',G:'#ffcd78'};
const BG='#163e46';
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// The vector mark is authored in public/icons/icon.svg.
// PNG encoder
function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(size, pad) {
  const px = Buffer.alloc(size * size * 3);
  const [br, bg, bb] = hex(BG);
  px.fill(0); for (let i = 0; i < size * size; i++) { px[i * 3] = br; px[i * 3 + 1] = bg; px[i * 3 + 2] = bb; }
  const W = MAP[0].length, Hh = MAP.length;
  const cell = Math.floor((size - 2 * pad) / Hh);
  const ox = Math.floor((size - cell * W) / 2), oy = Math.floor((size - cell * Hh) / 2);
  MAP.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!COLORS[ch]) return; const [r, g, b] = hex(COLORS[ch]);
    for (let yy = 0; yy < cell; yy++) for (let xx = 0; xx < cell; xx++) { const i = ((oy + y * cell + yy) * size + (ox + x * cell + xx)) * 3; px[i] = r; px[i + 1] = g; px[i + 2] = b; }
  }));
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 3 + 1)] = 0; px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
fs.writeFileSync(path.join(OUT, "icon-192.png"), png(192, 20));
fs.writeFileSync(path.join(OUT, "icon-512.png"), png(512, 56));
fs.writeFileSync(path.join(OUT, "icon-512-maskable.png"), png(512, 110));
console.log("icons written to", OUT);
