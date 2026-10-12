// Draws the app icon (sea, terracotta sun, white wave) into PNGs with no image library.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const [sea, sun, white] = ['#1F4E79', '#B5502F', '#F7F4EE'].map(hex)

function crc(buf) {
  let c, crc = -1
  for (const b of buf) { c = (crc ^ b) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c }
  return (crc ^ -1) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

for (const size of [192, 512]) {
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = [0]
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 64, v = (y / size) * 64 // same 64-unit space as icon.svg (full bleed for maskable)
      const wave = 40 + 3 * Math.sin((u / 16) * Math.PI * 2 + Math.PI)
      const px = v > wave ? white : (u - 42) ** 2 + (v - 24) ** 2 < 81 ? sun : sea
      row.push(...px)
    }
    rows.push(Buffer.from(row))
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))])
  writeFileSync(`public/icon-${size}.png`, png)
}
console.log('icons written')
