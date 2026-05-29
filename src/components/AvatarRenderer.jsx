import { useRef, useEffect } from 'react';
import { CHARACTER_CLASSES } from '../utils/shopData';

const K = '#1a1a2e';

function darken(hex, amt = 30) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

function lighten(hex, amt = 30) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

function blendColor(hex1, hex2, t) {
  const n1 = parseInt(hex1.replace('#',''), 16);
  const n2 = parseInt(hex2.replace('#',''), 16);
  const r = Math.round((n1 >> 16) * (1-t) + (n2 >> 16) * t);
  const g = Math.round(((n1 >> 8) & 0xff) * (1-t) + ((n2 >> 8) & 0xff) * t);
  const b = Math.round((n1 & 0xff) * (1-t) + (n2 & 0xff) * t);
  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// Fills a rect of pixels with shading: highlight top-left, shadow bottom-right
function shadedRect(x, y, w, h, base, { highlight, shadow, outlineColor = K, outline = true } = {}) {
  const hi = highlight || lighten(base, 25);
  const sh = shadow || darken(base, 25);
  const mid = base;
  const pixels = [];
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      if (outline && (row === y || row === y + h - 1 || col === x || col === x + w - 1)) {
        pixels.push([row, col, outlineColor]);
      } else {
        const distTop = row - y;
        const distLeft = col - x;
        const distBot = (y + h - 1) - row;
        const distRight = (x + w - 1) - col;
        if (distTop <= 1 || distLeft <= 1) pixels.push([row, col, hi]);
        else if (distBot <= 1 || distRight <= 1) pixels.push([row, col, sh]);
        else pixels.push([row, col, mid]);
      }
    }
  }
  return pixels;
}

function bodySprite64(skin) {
  const hi = lighten(skin, 20);
  const hi2 = lighten(skin, 35);
  const sh = darken(skin, 20);
  const sh2 = darken(skin, 35);
  const shDeep = darken(skin, 50);
  const blush = blendColor(skin, '#e8a0a0', 0.3);
  const pixels = [];

  // Head (rows 6-24, cols 20-43) — rounded oval with anti-aliased edges
  const headRows = [
    [26, 37], // row 6 — narrow top
    [24, 39], // row 7
    [23, 40], // row 8
    [22, 41], // row 9
    [21, 42], // row 10
    [21, 42], // row 11
    [21, 42], // row 12
    [21, 42], // row 13
    [21, 42], // row 14
    [21, 42], // row 15
    [21, 42], // row 16
    [21, 42], // row 17
    [22, 41], // row 18
    [22, 41], // row 19
    [23, 40], // row 20
    [23, 40], // row 21
    [24, 39], // row 22
    [25, 38], // row 23
    [27, 36], // row 24
  ];
  headRows.forEach(([left, right], i) => {
    const row = 6 + i;
    for (let c = left; c <= right; c++) {
      if (c === left || c === right) {
        pixels.push([row, c, K]);
      } else if (c === left + 1) {
        pixels.push([row, c, hi2]);
      } else if (c === left + 2) {
        pixels.push([row, c, hi]);
      } else if (c >= right - 1) {
        pixels.push([row, c, sh2]);
      } else if (c >= right - 2) {
        pixels.push([row, c, sh]);
      } else if (i <= 2) {
        pixels.push([row, c, hi]);
      } else if (i >= headRows.length - 3) {
        pixels.push([row, c, sh]);
      } else if (i >= 13 && i <= 16 && c >= 24 && c <= 28) {
        pixels.push([row, c, blush]);
      } else if (i >= 13 && i <= 16 && c >= 35 && c <= 39) {
        pixels.push([row, c, blush]);
      } else {
        pixels.push([row, c, skin]);
      }
    }
    // Anti-aliased outline corners
    if (i === 0) {
      for (let c = left; c <= right; c++) pixels.push([row - 1, c, K]);
      pixels.push([row - 1, left - 1, darken(K, -40)]);
      pixels.push([row - 1, right + 1, darken(K, -40)]);
    }
    if (i === headRows.length - 1) {
      for (let c = left + 2; c <= right - 2; c++) pixels.push([row + 1, c, K]);
    }
  });

  // Ears with shading
  for (let r = 12; r <= 17; r++) {
    pixels.push([r, 19, K], [r, 20, sh], [r, 21, skin]);
    pixels.push([r, 42, skin], [r, 43, sh2], [r, 44, K]);
  }
  pixels.push([11, 20, K], [18, 20, K], [11, 43, K], [18, 43, K]);

  // Neck with gradient shadow (rows 25-27)
  for (let r = 25; r <= 27; r++) {
    const neckSh = r === 25 ? sh : r === 26 ? sh2 : shDeep;
    for (let c = 27; c <= 36; c++) {
      if (c <= 28) pixels.push([r, c, neckSh]);
      else if (c >= 35) pixels.push([r, c, shDeep]);
      else pixels.push([r, c, r === 25 ? skin : sh]);
    }
  }

  // Torso (rows 28-44)
  for (let r = 28; r <= 44; r++) {
    const progress = (r - 28) / 16;
    const leftEdge = Math.round(18 - progress * 2);
    const rightEdge = Math.round(45 + progress * 2);
    for (let c = leftEdge; c <= rightEdge; c++) {
      if (c === leftEdge || c === rightEdge || r === 28) {
        pixels.push([r, c, K]);
      } else if (c === leftEdge + 1) {
        pixels.push([r, c, hi2]);
      } else if (c <= leftEdge + 3) {
        pixels.push([r, c, hi]);
      } else if (c >= rightEdge - 1) {
        pixels.push([r, c, sh2]);
      } else if (c >= rightEdge - 3) {
        pixels.push([r, c, sh]);
      } else {
        pixels.push([r, c, skin]);
      }
    }
  }

  // Arms with gradient shading (rows 29-42)
  for (let r = 29; r <= 42; r++) {
    const armProgress = (r - 29) / 13;
    for (let c = 12; c <= 17; c++) {
      if (c === 12 || c === 17 || r === 29) pixels.push([r, c, K]);
      else if (c === 13) pixels.push([r, c, hi]);
      else if (c === 16) pixels.push([r, c, sh]);
      else pixels.push([r, c, armProgress > 0.7 ? sh : skin]);
    }
    for (let c = 46; c <= 51; c++) {
      if (c === 46 || c === 51 || r === 29) pixels.push([r, c, K]);
      else if (c === 47) pixels.push([r, c, skin]);
      else if (c === 50) pixels.push([r, c, sh2]);
      else if (c === 49) pixels.push([r, c, sh]);
      else pixels.push([r, c, skin]);
    }
  }
  // Hands with finger detail
  for (let c = 12; c <= 17; c++) pixels.push([43, c, K]);
  for (let c = 46; c <= 51; c++) pixels.push([43, c, K]);
  pixels.push([42, 13, hi], [42, 14, skin], [42, 15, skin], [42, 16, sh]);
  pixels.push([42, 47, skin], [42, 48, skin], [42, 49, sh], [42, 50, sh2]);

  // Pants / trousers (rows 45-56)
  const pantColor = '#3d4f6a';
  const pantHi = lighten(pantColor, 20);
  const pantMid = pantColor;
  const pantSh = darken(pantColor, 18);
  const pantSh2 = darken(pantColor, 32);
  for (let r = 45; r <= 56; r++) {
    const worn = r >= 54; // faded near boots
    const pHi = worn ? pantSh : pantHi;
    const pMid = worn ? pantSh : pantMid;
    const pSh = worn ? pantSh2 : pantSh;
    // Left leg
    for (let c = 22; c <= 30; c++) {
      if (c === 22 || c === 30) pixels.push([r, c, K]);
      else if (c === 23) pixels.push([r, c, pHi]);
      else if (c === 24) pixels.push([r, c, pHi]);
      else if (c === 29) pixels.push([r, c, pantSh2]);
      else if (c === 28) pixels.push([r, c, pSh]);
      else pixels.push([r, c, pMid]);
    }
    // Right leg
    for (let c = 33; c <= 41; c++) {
      if (c === 33 || c === 41) pixels.push([r, c, K]);
      else if (c === 34) pixels.push([r, c, pMid]);
      else if (c === 40) pixels.push([r, c, pantSh2]);
      else if (c === 39) pixels.push([r, c, pSh]);
      else pixels.push([r, c, pMid]);
    }
  }
  // Belt at waist
  for (let c = 22; c <= 41; c++) {
    if (c >= 31 && c <= 32) continue;
    pixels.push([45, c, darken(pantColor, 25)]);
  }
  pixels.push([45, 31, '#b8860b'], [45, 32, '#b8860b']); // belt buckle
  // Leg separator shadow
  for (let r = 45; r <= 56; r++) {
    pixels.push([r, 31, pantSh2], [r, 32, pantSh2]);
  }

  // Boots with richer shading (rows 57-60)
  const bootColor = '#5c3d2e';
  const bootHi = lighten(bootColor, 25);
  const bootMid = lighten(bootColor, 10);
  const bootSh = darken(bootColor, 15);
  const bootSh2 = darken(bootColor, 30);
  for (let r = 57; r <= 59; r++) {
    for (let c = 20; c <= 31; c++) {
      if (r === 59 || c === 20 || c === 31) pixels.push([r, c, K]);
      else if (c <= 22) pixels.push([r, c, bootHi]);
      else if (c <= 24) pixels.push([r, c, bootMid]);
      else if (c >= 29) pixels.push([r, c, bootSh2]);
      else if (c >= 27) pixels.push([r, c, bootSh]);
      else pixels.push([r, c, bootColor]);
    }
    for (let c = 32; c <= 43; c++) {
      if (r === 59 || c === 32 || c === 43) pixels.push([r, c, K]);
      else if (c <= 34) pixels.push([r, c, bootMid]);
      else if (c >= 41) pixels.push([r, c, bootSh2]);
      else if (c >= 39) pixels.push([r, c, bootSh]);
      else pixels.push([r, c, bootColor]);
    }
  }
  // Boot soles
  for (let c = 20; c <= 31; c++) pixels.push([60, c, K]);
  for (let c = 32; c <= 43; c++) pixels.push([60, c, K]);
  // Boot top trim
  for (let c = 21; c <= 30; c++) pixels.push([57, c, bootHi]);
  for (let c = 33; c <= 42; c++) pixels.push([57, c, bootMid]);

  return pixels;
}

function faceSprite64(eyeColor, expression) {
  const pixels = [];
  const white = '#f0f0f0';
  const eyelid = '#d4a888';
  const pupil = darken(eyeColor, 50);
  const irisHi = lighten(eyeColor, 30);
  const noseSh = '#c4956a';
  const noseHi = lighten(noseSh, 15);
  const mouthColor = '#8b5e3c';
  const lipHi = lighten(mouthColor, 20);

  if (expression === 'cool') {
    // Sunglasses with glare
    for (let c = 24; c <= 29; c++) {
      pixels.push([12, c, '#374151']);
      pixels.push([13, c, c <= 25 ? '#1a1a2e' : '#2d2d44']);
      pixels.push([14, c, '#1a1a2e']);
      pixels.push([15, c, '#2d2d44']);
    }
    for (let c = 34; c <= 39; c++) {
      pixels.push([12, c, '#374151']);
      pixels.push([13, c, c >= 38 ? '#1a1a2e' : '#2d2d44']);
      pixels.push([14, c, '#1a1a2e']);
      pixels.push([15, c, '#2d2d44']);
    }
    // Glare on left lens
    pixels.push([13, 25, '#4b5563'], [13, 26, '#4b5563']);
    // Bridge
    for (let c = 30; c <= 33; c++) { pixels.push([13, c, '#374151']); pixels.push([14, c, '#374151']); }
    // Frame top
    for (let c = 24; c <= 39; c++) pixels.push([12, c, '#374151']);
  } else {
    // Left eye (cols 24-29, rows 12-16) — larger with more detail
    pixels.push([12, 25, K], [12, 26, K], [12, 27, K], [12, 28, K]);
    pixels.push([13, 24, K], [13, 25, white], [13, 26, white], [13, 27, eyeColor], [13, 28, irisHi], [13, 29, K]);
    pixels.push([14, 24, K], [14, 25, white], [14, 26, eyeColor], [14, 27, pupil], [14, 28, eyeColor], [14, 29, K]);
    pixels.push([15, 24, K], [15, 25, white], [15, 26, white], [15, 27, eyeColor], [15, 28, eyeColor], [15, 29, K]);
    pixels.push([16, 25, K], [16, 26, K], [16, 27, K], [16, 28, K]);
    // Eye highlight
    pixels.push([13, 25, '#ffffff'], [13, 26, '#ffffff']);

    // Right eye (cols 34-39, rows 12-16)
    pixels.push([12, 35, K], [12, 36, K], [12, 37, K], [12, 38, K]);
    pixels.push([13, 34, K], [13, 35, irisHi], [13, 36, eyeColor], [13, 37, white], [13, 38, white], [13, 39, K]);
    pixels.push([14, 34, K], [14, 35, eyeColor], [14, 36, pupil], [14, 37, eyeColor], [14, 38, white], [14, 39, K]);
    pixels.push([15, 34, K], [15, 35, eyeColor], [15, 36, eyeColor], [15, 37, white], [15, 38, white], [15, 39, K]);
    pixels.push([16, 35, K], [16, 36, K], [16, 37, K], [16, 38, K]);
    // Eye highlight
    pixels.push([13, 37, '#ffffff'], [13, 38, '#ffffff']);

    // Eyebrows
    if (expression === 'determined' || expression === 'fierce') {
      for (let c = 24; c <= 29; c++) pixels.push([11, c, K]);
      for (let c = 34; c <= 39; c++) pixels.push([11, c, K]);
      pixels.push([10, 24, K], [10, 34, K]);
    } else {
      for (let c = 25; c <= 28; c++) pixels.push([11, c, K]);
      for (let c = 35; c <= 38; c++) pixels.push([11, c, K]);
    }
  }

  // Nose with highlight (rows 17-20)
  pixels.push([17, 31, noseHi], [17, 32, noseSh]);
  pixels.push([18, 31, noseHi], [18, 32, noseSh]);
  pixels.push([19, 30, noseSh], [19, 31, noseHi], [19, 32, noseSh], [19, 33, darken(noseSh, 20)]);
  pixels.push([20, 30, darken(noseSh, 15)], [20, 33, darken(noseSh, 15)]);

  // Mouth with more detail
  if (expression === 'happy') {
    pixels.push([21, 28, lipHi], [21, 35, lipHi]);
    pixels.push([22, 28, mouthColor], [22, 29, mouthColor], [22, 30, mouthColor], [22, 31, mouthColor],
                [22, 32, mouthColor], [22, 33, mouthColor], [22, 34, mouthColor], [22, 35, mouthColor]);
    pixels.push([23, 29, mouthColor], [23, 30, '#c06060'], [23, 31, '#c06060'], [23, 32, '#c06060'],
                [23, 33, '#c06060'], [23, 34, mouthColor]);
    pixels.push([24, 30, mouthColor], [24, 31, mouthColor], [24, 32, mouthColor], [24, 33, mouthColor]);
    // Teeth
    pixels.push([22, 30, '#e8e8e8'], [22, 31, '#e8e8e8'], [22, 32, '#e8e8e8'], [22, 33, '#e8e8e8']);
  } else if (expression === 'fierce') {
    pixels.push([22, 28, mouthColor], [22, 35, mouthColor]);
    pixels.push([22, 29, mouthColor], [22, 30, '#e8e8e8'], [22, 31, mouthColor],
                [22, 32, mouthColor], [22, 33, '#e8e8e8'], [22, 34, mouthColor]);
    pixels.push([23, 29, mouthColor], [23, 30, mouthColor], [23, 31, mouthColor],
                [23, 32, mouthColor], [23, 33, mouthColor], [23, 34, mouthColor]);
  } else {
    pixels.push([22, 29, mouthColor], [22, 30, lipHi], [22, 31, lipHi],
                [22, 32, mouthColor], [22, 33, mouthColor], [22, 34, mouthColor]);
    pixels.push([23, 30, darken(mouthColor, 15)], [23, 31, darken(mouthColor, 15)],
                [23, 32, darken(mouthColor, 15)], [23, 33, darken(mouthColor, 15)]);
  }

  return pixels;
}

const HAIR_SPRITES_64 = {
  short: (color) => {
    const hi = lighten(color, 25);
    const sh = darken(color, 20);
    const pixels = [];
    // Top hair cap (rows 3-8)
    const hairRows = [
      [25, 38], [24, 39], [23, 40], [22, 41], [22, 41], [22, 41],
    ];
    hairRows.forEach(([left, right], i) => {
      const row = 3 + i;
      for (let c = left; c <= right; c++) {
        if (c === left || c === right) pixels.push([row, c, K]);
        else if (c <= left + 2) pixels.push([row, c, hi]);
        else if (c >= right - 2) pixels.push([row, c, sh]);
        else pixels.push([row, c, color]);
      }
    });
    // Outline top
    for (let c = 25; c <= 38; c++) pixels.push([2, c, K]);
    // Side bangs
    for (let r = 9; r <= 12; r++) {
      pixels.push([r, 21, sh], [r, 22, color]);
      pixels.push([r, 41, sh], [r, 42, color]);
    }
    return pixels;
  },
  medium: (color) => {
    const hi = lighten(color, 25);
    const sh = darken(color, 20);
    const pixels = HAIR_SPRITES_64.short(color);
    // Longer side hair
    for (let r = 9; r <= 18; r++) {
      pixels.push([r, 19, K], [r, 20, sh], [r, 21, color]);
      pixels.push([r, 42, color], [r, 43, sh], [r, 44, K]);
    }
    return pixels;
  },
  long: (color) => {
    const hi = lighten(color, 25);
    const sh = darken(color, 20);
    const pixels = HAIR_SPRITES_64.short(color);
    // Flowing side hair down to torso
    for (let r = 9; r <= 38; r++) {
      pixels.push([r, 17, K], [r, 18, sh], [r, 19, color], [r, 20, color]);
      pixels.push([r, 43, color], [r, 44, color], [r, 45, sh], [r, 46, K]);
    }
    // Taper ends
    pixels.push([39, 18, K], [39, 19, K], [39, 20, K]);
    pixels.push([39, 43, K], [39, 44, K], [39, 45, K]);
    return pixels;
  },
  ponytail: (color) => {
    const sh = darken(color, 20);
    const pixels = HAIR_SPRITES_64.short(color);
    // Ponytail going right-back
    for (let r = 10; r <= 30; r++) {
      pixels.push([r, 44, color], [r, 45, color], [r, 46, sh], [r, 47, K]);
    }
    // Tie
    pixels.push([16, 44, K], [16, 45, K], [16, 46, K]);
    // Taper
    pixels.push([31, 44, K], [31, 45, K], [31, 46, K]);
    return pixels;
  },
  mohawk: (color) => {
    const sh = darken(color, 20);
    const pixels = [];
    // Central mohawk ridge (rows 0-6)
    for (let r = 0; r <= 6; r++) {
      const w = r <= 2 ? 2 : r <= 4 ? 4 : 6;
      const left = 32 - Math.floor(w / 2);
      for (let c = left; c < left + w; c++) {
        if (c === left || c === left + w - 1) pixels.push([r, c, K]);
        else pixels.push([r, c, color]);
      }
    }
    // Wider base blending into head
    for (let c = 27; c <= 36; c++) pixels.push([7, c, color]);
    for (let c = 28; c <= 35; c++) pixels.push([8, c, color]);
    // Shaved sides
    for (let r = 7; r <= 10; r++) {
      pixels.push([r, 22, darken(color, 60)], [r, 23, darken(color, 60)]);
      pixels.push([r, 40, darken(color, 60)], [r, 41, darken(color, 60)]);
    }
    return pixels;
  },
  bald: () => [],
};

// Equipment overlays for 64x64
const ARMOR_SPRITES_64 = {
  starter_chain: () => {
    const p = [];
    const c1 = '#9ca3af', c2 = '#b0b8c4';
    for (let r = 29; r <= 43; r++)
      for (let c = 17; c <= 46; c++)
        if (c > 17 && c < 46) p.push([r, c, (r + c) % 2 === 0 ? c1 : c2]);
    return p;
  },
  starter_leather: () => {
    const base = '#8b6914', hi = lighten('#8b6914', 20), sh = darken('#8b6914', 20);
    const p = [];
    for (let r = 29; r <= 43; r++)
      for (let c = 17; c <= 46; c++) {
        if (c <= 19) p.push([r, c, hi]);
        else if (c >= 44) p.push([r, c, sh]);
        else p.push([r, c, base]);
      }
    // Belt
    for (let c = 17; c <= 46; c++) { p.push([38, c, '#5a3825']); p.push([39, c, '#78350f']); }
    p.push([38, 31, '#ffd700'], [38, 32, '#ffd700']); // buckle
    return p;
  },
  starter_robe: () => {
    const p = [];
    for (let r = 28; r <= 50; r++)
      for (let c = 17; c <= 46; c++) {
        if (c <= 19) p.push([r, c, '#4f46e5']);
        else if (c >= 44) p.push([r, c, '#3730a3']);
        else p.push([r, c, r % 2 === 0 ? '#4338ca' : '#4f46e5']);
      }
    // Trim
    for (let c = 17; c <= 46; c++) p.push([28, c, '#ffd700']);
    return p;
  },
  starter_plate: () => {
    const base = '#78716c', hi = '#9ca3af', sh = '#57534e';
    const p = [];
    for (let r = 29; r <= 43; r++)
      for (let c = 17; c <= 46; c++) {
        if (c <= 20) p.push([r, c, hi]);
        else if (c >= 43) p.push([r, c, sh]);
        else p.push([r, c, base]);
      }
    // Shoulder pads
    for (let r = 28; r <= 30; r++) {
      for (let c = 10; c <= 17; c++) p.push([r, c, hi]);
      for (let c = 46; c <= 53; c++) p.push([r, c, sh]);
    }
    // Chest emblem
    p.push([34, 30, '#ffd700'], [34, 31, '#ffd700'], [34, 32, '#ffd700'], [34, 33, '#ffd700']);
    p.push([35, 30, '#ffd700'], [35, 33, '#ffd700']);
    return p;
  },
  starter_tunic: () => {
    const p = [];
    for (let r = 29; r <= 43; r++)
      for (let c = 17; c <= 46; c++) {
        if (c <= 20) p.push([r, c, '#8b5cf6']);
        else if (c >= 43) p.push([r, c, '#6d28d9']);
        else p.push([r, c, '#7c3aed']);
      }
    // V-neck detail
    for (let i = 0; i < 4; i++) { p.push([29 + i, 30 + i, '#a78bfa']); p.push([29 + i, 33 - i, '#a78bfa']); }
    return p;
  },
  eq_iron_armor: () => {
    const p = [];
    for (let r = 29; r <= 43; r++)
      for (let c = 17; c <= 46; c++) {
        if (c <= 20) p.push([r, c, '#9ca3af']);
        else if (c >= 43) p.push([r, c, '#4b5563']);
        else p.push([r, c, (r + c) % 3 === 0 ? '#6b7280' : '#9ca3af']);
      }
    for (let r = 28; r <= 30; r++) {
      for (let c = 10; c <= 17; c++) p.push([r, c, '#6b7280']);
      for (let c = 46; c <= 53; c++) p.push([r, c, '#6b7280']);
    }
    return p;
  },
};

const WEAPON_SPRITES_64 = {
  starter_sword: () => {
    const p = [];
    // Blade
    for (let r = 20; r <= 42; r++) {
      p.push([r, 13, '#b0b8c4'], [r, 14, '#d1d5db'], [r, 15, '#9ca3af']);
    }
    // Blade tip
    p.push([19, 14, '#d1d5db'], [18, 14, '#e5e7eb']);
    // Guard
    for (let c = 10; c <= 18; c++) p.push([43, c, '#78350f']);
    for (let c = 11; c <= 17; c++) p.push([44, c, '#5a3825']);
    // Handle
    for (let r = 45; r <= 48; r++) { p.push([r, 13, '#3d2b1f']); p.push([r, 14, '#5a3825']); p.push([r, 15, '#3d2b1f']); }
    // Pommel
    p.push([49, 13, '#ffd700'], [49, 14, '#ffd700'], [49, 15, '#ffd700']);
    return p;
  },
  starter_bow: () => {
    const p = [];
    for (let r = 16; r <= 48; r++) p.push([r, 11, '#92400e']);
    for (let r = 18; r <= 46; r++) p.push([r, 12, '#d4a373']);
    // Tips
    p.push([15, 11, '#d4a373'], [15, 12, '#d4a373'], [49, 11, '#d4a373'], [49, 12, '#d4a373']);
    // String
    for (let r = 18; r <= 46; r++) p.push([r, 13, '#e5e7eb']);
    return p;
  },
  starter_staff: () => {
    const p = [];
    for (let r = 8; r <= 54; r++) p.push([r, 13, '#5a3825'], [r, 14, '#78350f']);
    // Orb
    for (let r = 4; r <= 7; r++) for (let c = 11; c <= 16; c++) {
      if ((r === 4 || r === 7) && (c === 11 || c === 16)) continue;
      p.push([r, c, r <= 5 ? '#c4b5fd' : '#a78bfa']);
    }
    p.push([5, 13, '#ede9fe'], [5, 14, '#ede9fe']); // shine
    return p;
  },
  starter_dagger: () => {
    const p = [];
    for (let r = 30; r <= 42; r++) p.push([r, 13, '#d1d5db'], [r, 14, '#e5e7eb']);
    p.push([29, 13, '#e5e7eb']); // tip
    for (let c = 11; c <= 16; c++) p.push([43, c, '#57534e']);
    for (let r = 44; r <= 46; r++) p.push([r, 13, '#78350f'], [r, 14, '#5a3825']);
    return p;
  },
  starter_lute: () => {
    const p = [];
    // Body
    for (let r = 38; r <= 46; r++) for (let c = 8; c <= 16; c++) {
      const dist = Math.abs(r - 42) + Math.abs(c - 12);
      if (dist <= 5) p.push([r, c, dist <= 3 ? '#b8860b' : '#92400e']);
    }
    // Sound hole
    p.push([42, 12, '#3d2b1f'], [42, 13, '#3d2b1f']);
    // Neck
    for (let r = 26; r <= 37; r++) p.push([r, 12, '#78350f'], [r, 13, '#5a3825']);
    // Head
    for (let c = 11; c <= 14; c++) p.push([25, c, '#78350f']);
    p.push([24, 11, '#ffd700'], [24, 14, '#ffd700']); // tuning pegs
    return p;
  },
  starter_wrench: () => {
    const p = [];
    for (let r = 26; r <= 48; r++) p.push([r, 13, '#6b7280'], [r, 14, '#9ca3af']);
    // Head
    for (let c = 10; c <= 17; c++) p.push([24, c, '#9ca3af'], [25, c, '#9ca3af']);
    p.push([24, 12, '#6b7280'], [24, 15, '#6b7280']); // jaw gap
    p.push([25, 12, '#6b7280'], [25, 15, '#6b7280']);
    return p;
  },
  eq_wooden_sword: () => WEAPON_SPRITES_64.starter_sword(),
  eq_fire_sword: () => {
    const p = [];
    for (let r = 20; r <= 42; r++) {
      p.push([r, 13, '#dc2626'], [r, 14, '#ef4444'], [r, 15, '#b91c1c']);
    }
    p.push([19, 14, '#ef4444'], [18, 14, '#f97316']);
    // Flames
    p.push([17, 13, '#fbbf24'], [17, 14, '#f97316'], [17, 15, '#fbbf24']);
    p.push([16, 14, '#fde68a']);
    for (let c = 10; c <= 18; c++) p.push([43, c, '#991b1b']);
    for (let r = 45; r <= 48; r++) p.push([r, 13, '#3d2b1f'], [r, 14, '#5a3825'], [r, 15, '#3d2b1f']);
    p.push([49, 14, '#ffd700']);
    return p;
  },
  eq_staff_wisdom: () => {
    const p = [];
    for (let r = 6; r <= 54; r++) p.push([r, 13, '#5b21b6'], [r, 14, '#7c3aed']);
    for (let r = 1; r <= 5; r++) for (let c = 10; c <= 17; c++) {
      if ((r === 1 || r === 5) && (c === 10 || c === 17)) continue;
      p.push([r, c, r <= 2 ? '#ede9fe' : '#ddd6fe']);
    }
    p.push([2, 13, '#ffffff'], [2, 14, '#ffffff']); // sparkle
    return p;
  },
};

const HEAD_SPRITES_64 = {
  starter_wizard_hat: () => {
    const p = [];
    const base = '#3b3080', hi = '#4f46e5';
    for (let c = 21; c <= 42; c++) p.push([6, c, base]);
    for (let c = 22; c <= 41; c++) p.push([5, c, base]);
    for (let c = 24; c <= 39; c++) p.push([4, c, hi]);
    for (let c = 26; c <= 37; c++) p.push([3, c, hi]);
    for (let c = 28; c <= 35; c++) p.push([2, c, hi]);
    for (let c = 30; c <= 33; c++) p.push([1, c, hi]);
    p.push([0, 31, '#ffd700'], [0, 32, '#ffd700']); // star
    // Brim
    for (let c = 18; c <= 45; c++) p.push([7, c, base]);
    for (let c = 19; c <= 44; c++) p.push([8, c, darken(base, 15)]);
    return p;
  },
  starter_helm: () => {
    const p = [];
    const base = '#78716c', hi = '#9ca3af';
    for (let c = 21; c <= 42; c++) { p.push([4, c, hi]); p.push([5, c, base]); p.push([6, c, base]); p.push([7, c, base]); p.push([8, c, base]); }
    for (let c = 24; c <= 39; c++) p.push([3, c, hi]);
    // Visor
    for (let c = 24; c <= 28; c++) p.push([13, c, '#374151']);
    for (let c = 35; c <= 39; c++) p.push([13, c, '#374151']);
    // Nose guard
    p.push([10, 31, base], [11, 31, base], [12, 31, base], [13, 31, base]);
    return p;
  },
  starter_goggles: () => {
    const p = [];
    const frame = '#78716c', lens = '#a8d8f0';
    for (let c = 24; c <= 29; c++) { p.push([12, c, frame]); p.push([13, c, c <= 24 || c >= 29 ? frame : lens]); p.push([14, c, c <= 24 || c >= 29 ? frame : lens]); p.push([15, c, frame]); }
    for (let c = 34; c <= 39; c++) { p.push([12, c, frame]); p.push([13, c, c <= 34 || c >= 39 ? frame : lens]); p.push([14, c, c <= 34 || c >= 39 ? frame : lens]); p.push([15, c, frame]); }
    // Bridge
    for (let c = 30; c <= 33; c++) p.push([13, c, frame]);
    // Strap
    for (let c = 20; c <= 23; c++) p.push([13, c, '#57534e']);
    for (let c = 40; c <= 43; c++) p.push([13, c, '#57534e']);
    return p;
  },
  eq_wizard_hat: () => HEAD_SPRITES_64.starter_wizard_hat(),
  eq_golden_crown: () => {
    const p = [];
    for (let c = 22; c <= 41; c++) p.push([6, c, '#ffd700']);
    for (let c = 23; c <= 40; c++) p.push([7, c, '#daa520']);
    // Points
    p.push([4, 24, '#ffd700'], [5, 24, '#ffd700'], [4, 31, '#ffd700'], [5, 31, '#ffd700']);
    p.push([4, 32, '#ffd700'], [5, 32, '#ffd700'], [4, 39, '#ffd700'], [5, 39, '#ffd700']);
    // Gems
    p.push([6, 28, '#ef4444'], [6, 35, '#3b82f6']);
    return p;
  },
  eq_mythic_helm: () => {
    const p = [];
    for (let c = 19; c <= 44; c++) { p.push([3, c, '#4b5563']); p.push([4, c, '#6b7280']); p.push([5, c, '#6b7280']); p.push([6, c, '#6b7280']); p.push([7, c, '#4b5563']); }
    // Plume
    for (let r = 0; r <= 3; r++) { p.push([r, 31, '#dc2626']); p.push([r, 32, '#ef4444']); }
    // Visor
    for (let c = 25; c <= 29; c++) p.push([13, c, '#1f2937']);
    for (let c = 34; c <= 38; c++) p.push([13, c, '#1f2937']);
    return p;
  },
};

const BACK_SPRITES_64 = {
  starter_cloak: () => {
    const p = [];
    for (let r = 28; r <= 52; r++) {
      p.push([r, 15, '#78716c'], [r, 16, '#6b7280']);
      p.push([r, 47, '#6b7280'], [r, 48, '#78716c']);
    }
    return p;
  },
  starter_hood: () => {
    const p = [];
    for (let c = 22; c <= 41; c++) { p.push([4, c, '#1a1a2e']); p.push([5, c, '#2d2d44']); p.push([6, c, '#1a1a2e']); }
    for (let r = 28; r <= 48; r++) {
      p.push([r, 15, '#1a1a2e'], [r, 16, '#2d2d44']);
      p.push([r, 47, '#2d2d44'], [r, 48, '#1a1a2e']);
    }
    return p;
  },
  eq_leather_cloak: () => {
    const p = [];
    for (let r = 28; r <= 52; r++) {
      p.push([r, 13, '#92400e'], [r, 14, '#7c3415'], [r, 15, '#92400e'], [r, 16, '#7c3415']);
      p.push([r, 47, '#7c3415'], [r, 48, '#92400e'], [r, 49, '#7c3415'], [r, 50, '#92400e']);
    }
    return p;
  },
  eq_dragon_cloak: () => {
    const p = [];
    for (let r = 28; r <= 52; r++) {
      p.push([r, 13, '#7f1d1d'], [r, 14, '#991b1b'], [r, 15, '#991b1b'], [r, 16, '#7f1d1d']);
      p.push([r, 47, '#7f1d1d'], [r, 48, '#991b1b'], [r, 49, '#991b1b'], [r, 50, '#7f1d1d']);
    }
    p.push([52, 12, '#ef4444'], [52, 51, '#ef4444']);
    return p;
  },
  eq_guild_banner: () => {
    const p = [];
    for (let r = 12; r <= 50; r++) p.push([r, 52, '#78350f'], [r, 53, '#5a3825']);
    for (let r = 12; r <= 26; r++) for (let c = 48; c <= 58; c++) p.push([r, c, '#4338ca']);
    p.push([19, 52, '#ffd700'], [19, 53, '#ffd700'], [20, 52, '#ffd700'], [20, 53, '#ffd700']);
    return p;
  },
};

const COMPANION_PIXELS_64 = {
  pet_owl: () => {
    const ox = 52, oy = 38;
    return [
      [oy, ox+1, '#92400e'], [oy, ox+2, '#92400e'], [oy, ox+3, '#92400e'],
      [oy+1, ox, '#92400e'], [oy+1, ox+1, '#fbbf24'], [oy+1, ox+2, K], [oy+1, ox+3, '#fbbf24'], [oy+1, ox+4, '#92400e'],
      [oy+2, ox, '#78350f'], [oy+2, ox+1, '#92400e'], [oy+2, ox+2, '#d97706'], [oy+2, ox+3, '#92400e'], [oy+2, ox+4, '#78350f'],
      [oy+3, ox+1, '#78350f'], [oy+3, ox+2, '#78350f'], [oy+3, ox+3, '#78350f'],
      [oy+4, ox+1, '#5a3825'], [oy+4, ox+3, '#5a3825'],
    ];
  },
  pet_fox: () => {
    const ox = 52, oy = 42;
    return [
      [oy, ox, '#ea580c'], [oy, ox+4, '#ea580c'],
      [oy+1, ox, '#f97316'], [oy+1, ox+1, '#fff'], [oy+1, ox+2, K], [oy+1, ox+3, '#fff'], [oy+1, ox+4, '#f97316'],
      [oy+2, ox, '#f97316'], [oy+2, ox+1, '#f97316'], [oy+2, ox+2, '#f97316'], [oy+2, ox+3, '#f97316'], [oy+2, ox+4, '#f97316'],
      [oy+3, ox+1, '#f97316'], [oy+3, ox+2, '#fff'], [oy+3, ox+3, '#f97316'],
      [oy+4, ox+2, '#f97316'],
    ];
  },
  pet_wolf: () => {
    const ox = 52, oy = 40;
    return [
      [oy, ox, '#6b7280'], [oy, ox+4, '#6b7280'],
      [oy+1, ox, '#9ca3af'], [oy+1, ox+1, '#d1d5db'], [oy+1, ox+2, K], [oy+1, ox+3, '#d1d5db'], [oy+1, ox+4, '#9ca3af'],
      [oy+2, ox, '#6b7280'], [oy+2, ox+1, '#9ca3af'], [oy+2, ox+2, '#6b7280'], [oy+2, ox+3, '#9ca3af'], [oy+2, ox+4, '#6b7280'],
      [oy+3, ox+1, '#6b7280'], [oy+3, ox+2, '#6b7280'], [oy+3, ox+3, '#6b7280'],
      [oy+4, ox, '#6b7280'], [oy+4, ox+4, '#6b7280'],
    ];
  },
  pet_dragon: () => {
    const ox = 50, oy = 8;
    return [
      [oy, ox+2, '#22c55e'], [oy, ox+3, '#22c55e'],
      [oy+1, ox+1, '#16a34a'], [oy+1, ox+2, '#4ade80'], [oy+1, ox+3, '#4ade80'], [oy+1, ox+4, '#16a34a'],
      [oy+2, ox, '#16a34a'], [oy+2, ox+1, '#22c55e'], [oy+2, ox+2, '#4ade80'], [oy+2, ox+3, '#22c55e'], [oy+2, ox+4, '#16a34a'], [oy+2, ox+5, '#16a34a'],
      [oy+3, ox+1, '#16a34a'], [oy+3, ox+2, '#16a34a'], [oy+3, ox+3, '#16a34a'], [oy+3, ox+4, '#16a34a'],
      [oy+4, ox+1, '#0d6b3a'], [oy+4, ox+4, '#0d6b3a'],
      [oy+2, ox+6, '#f97316'], [oy+1, ox+5, '#fbbf24'],
    ];
  },
  pet_raven: () => {
    const ox = 52, oy = 12;
    return [
      [oy, ox+2, '#1a1a2e'],
      [oy+1, ox+1, '#374151'], [oy+1, ox+2, '#1f2937'], [oy+1, ox+3, '#374151'],
      [oy+2, ox, '#4b5563'], [oy+2, ox+1, '#374151'], [oy+2, ox+2, '#1f2937'], [oy+2, ox+3, '#374151'], [oy+2, ox+4, '#4b5563'],
      [oy+3, ox+1, '#374151'], [oy+3, ox+3, '#374151'],
    ];
  },
  pet_fairy: () => {
    const ox = 52, oy = 16;
    return [
      [oy, ox+1, '#f0abfc'], [oy, ox+3, '#f0abfc'],
      [oy+1, ox, '#e879f9'], [oy+1, ox+1, '#fde68a'], [oy+1, ox+2, '#fde68a'], [oy+1, ox+3, '#fde68a'], [oy+1, ox+4, '#e879f9'],
      [oy+2, ox+1, '#fde68a'], [oy+2, ox+2, '#fbbf24'], [oy+2, ox+3, '#fde68a'],
      [oy+3, ox+2, '#fde68a'],
    ];
  },
  pet_golem: () => {
    const ox = 52, oy = 40;
    return [
      [oy, ox, '#78716c'], [oy, ox+1, '#a8a29e'], [oy, ox+2, '#a8a29e'], [oy, ox+3, '#a8a29e'], [oy, ox+4, '#78716c'],
      [oy+1, ox, '#a8a29e'], [oy+1, ox+1, '#d6d3d1'], [oy+1, ox+2, '#e7e5e4'], [oy+1, ox+3, '#d6d3d1'], [oy+1, ox+4, '#a8a29e'],
      [oy+2, ox, '#78716c'], [oy+2, ox+1, '#a8a29e'], [oy+2, ox+2, '#a8a29e'], [oy+2, ox+3, '#a8a29e'], [oy+2, ox+4, '#78716c'],
      [oy+3, ox, '#57534e'], [oy+3, ox+1, '#78716c'], [oy+3, ox+3, '#78716c'], [oy+3, ox+4, '#57534e'],
      [oy+4, ox, '#44403c'], [oy+4, ox+4, '#44403c'],
    ];
  },
  pet_phoenix: () => {
    const ox = 50, oy = 6;
    return [
      [oy, ox+3, '#fbbf24'],
      [oy+1, ox+2, '#f97316'], [oy+1, ox+3, '#ef4444'], [oy+1, ox+4, '#f97316'],
      [oy+2, ox+1, '#fbbf24'], [oy+2, ox+2, '#ef4444'], [oy+2, ox+3, '#dc2626'], [oy+2, ox+4, '#ef4444'], [oy+2, ox+5, '#fbbf24'],
      [oy+3, ox+2, '#f97316'], [oy+3, ox+3, '#ef4444'], [oy+3, ox+4, '#f97316'],
      [oy+4, ox+3, '#f97316'],
    ];
  },
};

function drawBackground64(ctx) {
  // Dark gradient sky
  const skyTop = '#0f172a';
  const skyBot = '#1e293b';
  for (let r = 0; r < 64; r++) {
    const t = r / 63;
    const rt = Math.round(parseInt(skyTop.slice(1,3),16) * (1-t) + parseInt(skyBot.slice(1,3),16) * t);
    const gt = Math.round(parseInt(skyTop.slice(3,5),16) * (1-t) + parseInt(skyBot.slice(3,5),16) * t);
    const bt = Math.round(parseInt(skyTop.slice(5,7),16) * (1-t) + parseInt(skyBot.slice(5,7),16) * t);
    ctx.fillStyle = `rgb(${rt},${gt},${bt})`;
    ctx.fillRect(0, r, 64, 1);
  }
  // Ground
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 54, 64, 10);
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 54, 64, 1);
  // Moon
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(52, 4, 4, 4);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(53, 5, 2, 2);
  // Stars
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(8, 3, 1, 1); ctx.fillRect(20, 6, 1, 1);
  ctx.fillRect(38, 2, 1, 1); ctx.fillRect(45, 8, 1, 1);
  ctx.fillRect(12, 10, 1, 1); ctx.fillRect(58, 6, 1, 1);
}

export default function AvatarRenderer({ avatar, size = 200, showBackground = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !avatar) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    const skin = avatar.skinTone || '#fde2c4';
    const hair = avatar.hairColor || '#2c1810';
    const eye = avatar.eyeColor || '#4a3728';
    const expr = avatar.expression || 'neutral';
    const hairStyle = avatar.hairStyle || 'short';

    const cls = CHARACTER_CLASSES.find(c => c.id === avatar.class) || CHARACTER_CLASSES[0];
    const sg = cls.startGear || {};
    const armorId = avatar.equippedArmor || sg.armor || null;
    const weaponId = avatar.equippedWeapon || sg.weapon || null;
    const headId = avatar.equippedHead || sg.head || null;
    const backId = avatar.equippedBack || sg.back || null;

    if (showBackground) drawBackground64(ctx);

    const layers = [];

    if (backId && BACK_SPRITES_64[backId]) layers.push(...BACK_SPRITES_64[backId]());

    layers.push(...bodySprite64(skin));

    if (armorId && ARMOR_SPRITES_64[armorId]) layers.push(...ARMOR_SPRITES_64[armorId]());

    if (weaponId && WEAPON_SPRITES_64[weaponId]) layers.push(...WEAPON_SPRITES_64[weaponId]());

    layers.push(...faceSprite64(eye, expr));

    const hairGen = HAIR_SPRITES_64[hairStyle] || HAIR_SPRITES_64.short;
    layers.push(...hairGen(hair));

    if (headId && HEAD_SPRITES_64[headId]) layers.push(...HEAD_SPRITES_64[headId]());

    if (avatar.equippedCompanion && COMPANION_PIXELS_64[avatar.equippedCompanion]) {
      layers.push(...COMPANION_PIXELS_64[avatar.equippedCompanion]());
    }

    for (const [r, c, color] of layers) {
      if (color && r >= 0 && r < 64 && c >= 0 && c < 64) {
        ctx.fillStyle = color;
        ctx.fillRect(c, r, 1, 1);
      }
    }
  }, [avatar, showBackground]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
      className="rounded-lg"
    />
  );
}
