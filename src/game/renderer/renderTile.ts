import { POWER } from "../GameManager";

const COLOR_PROGRESSION: [string, number][] = [
  ["#000000", 1], // 1
  ["#EEE4DA", 0], // 2
  ["#EDE0C8", 0], // 4
  ["#F2B179", 1], // 8
  ["#F59563", 1], // 16
  ["#F67C60", 1], // 32
  ["#F65E3B", 1], // 64
  ["#EDCF73", 1], // 128
  ["#EDCC62", 1], // 256
  ["#EDC850", 1], // 512
  ["#EDC53F", 1], // 1024
  ["#EDC22D", 1], // 2048
  ["#3C3A32", 1], // 4096+
];

export default function renderTile(
  ctx: CanvasRenderingContext2D,
  tileSize: number,
  lx: number,
  ly: number,
  scale: number,
  value: number,
  tilePadding: number
) {
  const colorSet =
    value >= COLOR_PROGRESSION.length
      ? COLOR_PROGRESSION.at(-1)!
      : COLOR_PROGRESSION[value];
  renderTileBackground(ctx, lx, ly, tileSize, scale, colorSet[0], tilePadding);
  const displayedValue = POWER ** value;
  const textColor = colorSet[1] > 0 ? "#F9F6F2" : "#776E65";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textColor;
  ctx.font = `bold ${(tileSize * scale) / 2}px Arial`;
  ctx.fillText(
    displayedValue.toString(),
    tilePadding + lx * (tileSize + tilePadding) + tileSize / 2,
    tilePadding + ly * (tileSize + tilePadding) + tileSize / 2,
    tileSize
  );
}

export function renderTileBackground(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  tileSize: number,
  scale: number,
  background: string,
  tilePadding: number
) {
  ctx.beginPath();
  ctx.fillStyle = background;
  ctx.roundRect(
    tilePadding +
      lx * (tileSize + tilePadding) +
      ((tileSize + tilePadding) * (1 - scale)) / 2,
    tilePadding +
      ly * (tileSize + tilePadding) +
      ((tileSize + tilePadding) * (1 - scale)) / 2,
    tileSize * scale,
    tileSize * scale,
    (tileSize * scale) / 4
  );
  ctx.fill();
}
