/**
 * SVG-based layered character renderer.
 * Builds a RPG character from body parts that can be swapped via equipment/customization.
 */

import { SHOP_ITEMS, STARTER_GEAR, CHARACTER_CLASSES } from '../utils/shopData';

// Color helpers
const darken = (hex, amt = 30) => {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

const lighten = (hex, amt = 30) => {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

// Hair SVG generators by style (returns full SVG string, not just path)
const HAIR_SVG = {
  short: (color) => `
    <path d="M34,40 C34,27 40,21 50,21 C60,21 66,27 66,40 L65,36 C64,28 59,23 50,23 C41,23 36,28 35,36 Z" fill="${color}"/>
    <path d="M34,38 Q34,32 37,28 L36,34 Z" fill="${color}" opacity="0.7"/>
    <path d="M66,38 Q66,32 63,28 L64,34 Z" fill="${color}" opacity="0.7"/>
  `,
  medium: (color) => `
    <path d="M32,42 C32,25 38,19 50,19 C62,19 68,25 68,42" fill="${color}"/>
    <path d="M32,42 C31,48 31,52 32,50 L32,42" fill="${color}"/>
    <path d="M68,42 C69,48 69,52 68,50 L68,42" fill="${color}"/>
    <path d="M36,22 C40,19 45,18 50,18 C55,18 60,19 64,22" fill="${color}" opacity="0.8"/>
  `,
  long: (color) => `
    <path d="M30,42 C30,24 37,17 50,17 C63,17 70,24 70,42" fill="${color}"/>
    <path d="M30,42 L29,58 C28,65 29,70 31,68 L32,55 L32,42" fill="${color}"/>
    <path d="M70,42 L71,58 C72,65 71,70 69,68 L68,55 L68,42" fill="${color}"/>
    <path d="M36,20 C41,16 46,15 50,15 C54,15 59,16 64,20" fill="${lighten(color, 15)}" opacity="0.5"/>
  `,
  ponytail: (color) => `
    <path d="M34,40 C34,27 40,21 50,21 C60,21 66,27 66,40 L65,36 C64,28 59,23 50,23 C41,23 36,28 35,36 Z" fill="${color}"/>
    <path d="M58,26 C60,28 64,32 66,40 L67,50 C67,55 68,62 66,65 C64,68 62,65 63,60 L64,50 L63,38 C62,32 60,28 58,26" fill="${color}"/>
    <ellipse cx="65" cy="65" rx="3" ry="2" fill="${color}"/>
  `,
  mohawk: (color) => `
    <path d="M46,36 L44,16 C44,10 46,6 50,6 C54,6 56,10 56,16 L54,36" fill="${color}"/>
    <path d="M45,20 L50,5 L55,20" fill="${lighten(color, 20)}" opacity="0.3"/>
    <path d="M36,40 C36,34 38,30 42,28" fill="${color}" opacity="0.5"/>
    <path d="M64,40 C64,34 62,30 58,28" fill="${color}" opacity="0.5"/>
  `,
  bald: () => '',
};

// Eye shapes
const EYES = {
  neutral: (x, y, color) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="3.5" fill="white"/><circle cx="${x}" cy="${y}" r="2" fill="${color}"/><circle cx="${x+0.7}" cy="${y-0.7}" r="0.7" fill="white"/>`,
  happy: (x, y, color) => `<path d="${`M${x-3},${y} Q${x},${y-4} ${x+3},${y}`}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`,
  determined: (x, y, color) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="3" fill="white"/><circle cx="${x}" cy="${y+0.5}" r="2.2" fill="${color}"/><circle cx="${x+0.7}" cy="${y-0.3}" r="0.7" fill="white"/><line x1="${x-3}" y1="${y-4}" x2="${x+2}" y2="${y-3}" stroke="${darken(color)}" stroke-width="1.2"/>`,
  cool: (x, y) => `<rect x="${x-4.5}" y="${y-2}" width="9" height="4" rx="2" fill="#1a1a2e"/><rect x="${x-4}" y="${y-1.5}" width="8" height="3" rx="1.5" fill="#2d2d44" opacity="0.7"/>`,
  fierce: (x, y, color) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2.5" fill="white"/><circle cx="${x}" cy="${y+0.3}" r="2" fill="${color}"/><circle cx="${x+0.7}" cy="${y-0.3}" r="0.6" fill="white"/><line x1="${x-4}" y1="${y-4}" x2="${x+1}" y2="${y-2.5}" stroke="${darken(color)}" stroke-width="1.5"/>`,
};

// Mouth shapes
const MOUTHS = {
  neutral: (x, y) => `<line x1="${x-3}" y1="${y}" x2="${x+3}" y2="${y}" stroke="#8b5e3c" stroke-width="1.2" stroke-linecap="round"/>`,
  happy: (x, y) => `<path d="M${x-4},${y-1} Q${x},${y+4} ${x+4},${y-1}" fill="none" stroke="#8b5e3c" stroke-width="1.2" stroke-linecap="round"/>`,
  determined: (x, y) => `<line x1="${x-3}" y1="${y+0.5}" x2="${x+3}" y2="${y-0.5}" stroke="#8b5e3c" stroke-width="1.5" stroke-linecap="round"/>`,
  cool: (x, y) => `<path d="M${x-3},${y} Q${x},${y+2} ${x+3},${y}" fill="none" stroke="#8b5e3c" stroke-width="1.2" stroke-linecap="round"/>`,
  fierce: (x, y) => `<path d="M${x-3},${y+1} L${x},${y-1} L${x+3},${y+1}" fill="none" stroke="#8b5e3c" stroke-width="1.5" stroke-linecap="round"/>`,
};

// Equipment overlay SVG (positioned on the character)
const EQUIPMENT_OVERLAYS = {
  // Head items
  eq_wizard_hat: '<polygon points="50,8 40,32 60,32" fill="#4a3b8f" stroke="#6b5cbf" stroke-width="0.5"/><ellipse cx="50" cy="32" rx="14" ry="3" fill="#4a3b8f"/><circle cx="50" cy="12" r="2" fill="#ffd700"/>',
  eq_golden_crown: '<path d="M38,28 L40,20 L44,26 L48,18 L52,26 L56,18 L60,26 L62,28 Z" fill="#ffd700" stroke="#daa520" stroke-width="0.5"/><circle cx="50" cy="22" r="1.5" fill="#ef4444"/>',
  eq_mythic_helm: '<path d="M35,38 L35,26 C35,18 42,14 50,14 C58,14 65,18 65,26 L65,38" fill="#6b7280" stroke="#9ca3af" stroke-width="0.8"/><rect x="43" y="30" width="14" height="6" rx="1" fill="#374151"/><line x1="50" y1="14" x2="50" y2="8" stroke="#9ca3af" stroke-width="2"/>',
  starter_wizard_hat: '<polygon points="50,12 42,30 58,30" fill="#3b3080" stroke="#5b4fbf" stroke-width="0.5"/><ellipse cx="50" cy="30" rx="12" ry="2.5" fill="#3b3080"/>',
  starter_helm: '<path d="M37,38 L37,28 C37,22 42,18 50,18 C58,18 63,22 63,28 L63,38" fill="#78716c" stroke="#a8a29e" stroke-width="0.6"/><rect x="44" y="32" width="12" height="5" rx="1" fill="#57534e"/>',
  starter_goggles: '<ellipse cx="42" cy="40" rx="6" ry="4" fill="none" stroke="#78716c" stroke-width="1.5"/><ellipse cx="58" cy="40" rx="6" ry="4" fill="none" stroke="#78716c" stroke-width="1.5"/><line x1="48" y1="40" x2="52" y2="40" stroke="#78716c" stroke-width="1"/><rect x="42" y="38" width="16" height="4" rx="2" fill="#a8a29e" opacity="0.3"/>',
  // Weapons
  eq_wooden_sword: '<rect x="18" y="45" width="3" height="22" rx="1" fill="#92400e" transform="rotate(-15,19,56)"/><rect x="15" y="44" width="9" height="3" rx="1" fill="#78350f" transform="rotate(-15,19,45)"/>',
  eq_fire_sword: '<rect x="18" y="40" width="3" height="28" rx="1" fill="#dc2626" transform="rotate(-15,19,54)"/><rect x="15" y="39" width="9" height="3" rx="1" fill="#991b1b" transform="rotate(-15,19,40)"/><circle cx="15" cy="42" r="4" fill="#f97316" opacity="0.5"><animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite"/></circle>',
  eq_staff_wisdom: '<rect x="18" y="35" width="2.5" height="35" rx="1" fill="#7c3aed" transform="rotate(-10,19,52)"/><circle cx="17" cy="36" r="4" fill="#a78bfa" opacity="0.7"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></circle>',
  starter_sword: '<rect x="20" y="48" width="2.5" height="18" rx="1" fill="#78716c" transform="rotate(-15,21,57)"/><rect x="17" y="47" width="8" height="2.5" rx="1" fill="#57534e" transform="rotate(-15,21,48)"/>',
  starter_bow: '<path d="M18,42 C14,50 14,60 18,68" fill="none" stroke="#92400e" stroke-width="2"/><line x1="18" y1="42" x2="18" y2="68" stroke="#d4a373" stroke-width="0.8"/>',
  starter_staff: '<rect x="19" y="38" width="2" height="30" rx="1" fill="#78350f" transform="rotate(-8,20,53)"/><circle cx="19" cy="38" r="3" fill="#a67c52" opacity="0.6"/>',
  starter_dagger: '<rect x="22" y="55" width="2" height="12" rx="0.5" fill="#9ca3af" transform="rotate(-20,23,61)"/><rect x="20" y="54" width="6" height="2" rx="0.5" fill="#57534e" transform="rotate(-20,23,55)"/>',
  starter_lute: '<ellipse cx="22" cy="62" rx="5" ry="7" fill="#92400e" transform="rotate(-15,22,62)"/><rect x="21" y="48" width="2" height="14" rx="0.5" fill="#78350f" transform="rotate(-15,22,55)"/>',
  starter_wrench: '<rect x="20" y="52" width="2" height="16" rx="1" fill="#6b7280" transform="rotate(-10,21,60)"/><path d="M18,52 C16,50 17,47 20,47 C23,47 24,50 22,52" fill="#9ca3af" transform="rotate(-10,20,50)"/>',
  // Back items
  eq_leather_cloak: '<path d="M35,42 C32,50 30,65 33,78 L50,75 L67,78 C70,65 68,50 65,42" fill="#92400e" opacity="0.6"/>',
  eq_dragon_cloak: '<path d="M35,42 C32,50 28,65 33,80 L50,76 L67,80 C72,65 68,50 65,42" fill="#7f1d1d" opacity="0.7"/><path d="M33,80 L30,82 M67,80 L70,82" stroke="#991b1b" stroke-width="1.5"/>',
  eq_guild_banner: '<line x1="70" y1="30" x2="70" y2="75" stroke="#78350f" stroke-width="2"/><rect x="60" y="30" width="18" height="14" rx="1" fill="#4338ca"/><text x="69" y="41" text-anchor="middle" fill="#ffd700" font-size="8" font-weight="bold">G</text>',
  starter_cloak: '<path d="M37,44 C35,52 34,62 36,74 L50,72 L64,74 C66,62 65,52 63,44" fill="#78716c" opacity="0.45"/>',
  starter_hood: '<path d="M37,44 C35,52 34,60 36,70 L50,68 L64,70 C66,60 65,52 63,44" fill="#1a1a2e" opacity="0.5"/><path d="M38,32 C38,24 43,20 50,20 C57,20 62,24 62,32" fill="#1a1a2e" opacity="0.3"/>',
  // Armor
  eq_iron_armor: '<path d="M38,45 L38,62 L50,65 L62,62 L62,45 L56,42 L44,42 Z" fill="#9ca3af" stroke="#6b7280" stroke-width="0.8"/>',
  starter_chain: '<path d="M40,56 L40,72 L50,74 L60,72 L60,56 L55,54 L45,54 Z" fill="#9ca3af" opacity="0.5"/><line x1="45" y1="58" x2="55" y2="58" stroke="#d4d4d8" stroke-width="0.5"/><line x1="45" y1="62" x2="55" y2="62" stroke="#d4d4d8" stroke-width="0.5"/><line x1="45" y1="66" x2="55" y2="66" stroke="#d4d4d8" stroke-width="0.5"/>',
  starter_leather: '<path d="M40,56 L40,72 L50,74 L60,72 L60,56 L55,54 L45,54 Z" fill="#92400e" opacity="0.45"/>',
  starter_robe: '<path d="M38,54 L38,78 L50,80 L62,78 L62,54 L56,52 L44,52 Z" fill="#4338ca" opacity="0.4"/><line x1="50" y1="54" x2="50" y2="78" stroke="#6366f1" stroke-width="0.5" opacity="0.5"/>',
  starter_plate: '<path d="M39,55 L39,70 L50,72 L61,70 L61,55 L56,53 L44,53 Z" fill="#78716c" stroke="#a8a29e" stroke-width="0.6"/><circle cx="50" cy="60" r="3" fill="#a8a29e" opacity="0.4"/>',
  starter_tunic: '<path d="M40,56 L40,74 L50,76 L60,74 L60,56 L55,54 L45,54 Z" fill="#7c3aed" opacity="0.35"/>',
};

// Companion positions
const COMPANION_SPRITES = {
  pet_owl: { emoji: '🦉', x: 75, y: 65 },
  pet_fox: { emoji: '🦊', x: 75, y: 70 },
  pet_wolf: { emoji: '🐺', x: 75, y: 68 },
  pet_dragon: { emoji: '🐉', x: 72, y: 20 },
  pet_raven: { emoji: '🐦‍⬛', x: 72, y: 25 },
  pet_fairy: { emoji: '🧚', x: 70, y: 30 },
  pet_golem: { emoji: '🗿', x: 78, y: 65 },
  pet_phoenix: { emoji: '🔥', x: 72, y: 18 },
};

// Aura effects
const AURA_EFFECTS = {
  aura_fire: '<circle cx="50" cy="55" r="30" fill="url(#auraFire)" opacity="0.3"><animate attributeName="r" values="28;32;28" dur="2s" repeatCount="indefinite"/></circle>',
  aura_arcane: '<circle cx="50" cy="55" r="28" fill="none" stroke="#a855f7" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"><animateTransform attributeName="transform" type="rotate" values="0 50 55;360 50 55" dur="8s" repeatCount="indefinite"/></circle><circle cx="50" cy="55" r="22" fill="none" stroke="#c084fc" stroke-width="0.5" stroke-dasharray="2,4" opacity="0.4"><animateTransform attributeName="transform" type="rotate" values="360 50 55;0 50 55" dur="6s" repeatCount="indefinite"/></circle>',
  aura_lightning: '<line x1="42" y1="25" x2="38" y2="35" stroke="#facc15" stroke-width="1.5" opacity="0.6"><animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite"/></line><line x1="58" y1="28" x2="62" y2="38" stroke="#facc15" stroke-width="1" opacity="0.4"><animate attributeName="opacity" values="0;0.8;0" dur="0.7s" repeatCount="indefinite"/></line>',
  aura_golden: '<circle cx="50" cy="50" r="35" fill="url(#auraGolden)" opacity="0.25"><animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite"/></circle>',
  aura_shadow: '<circle cx="50" cy="70" rx="25" ry="8" fill="#1a1a2e" opacity="0.4"><animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite"/></circle>',
  aura_runes: '<text x="30" y="35" fill="#a78bfa" font-size="8" opacity="0.6"><animateTransform attributeName="transform" type="rotate" values="0 50 55;360 50 55" dur="10s" repeatCount="indefinite"/>ᚠ ᚢ ᚦ</text><text x="55" y="75" fill="#c084fc" font-size="7" opacity="0.5"><animateTransform attributeName="transform" type="rotate" values="360 50 55;0 50 55" dur="12s" repeatCount="indefinite"/>ᚨ ᚱ ᚲ</text>',
};

// Background scenes
const BACKGROUNDS = {
  default: '<rect width="100" height="100" fill="#1e293b"/><rect y="75" width="100" height="25" fill="#334155"/><circle cx="80" cy="15" r="6" fill="#fde68a" opacity="0.7"/>',
  bg_forest: '<rect width="100" height="100" fill="#1a3a1a"/><rect y="72" width="100" height="28" fill="#2d5a2d"/><circle cx="15" cy="40" r="12" fill="#22543d"/><circle cx="85" cy="35" r="15" fill="#276749"/><rect x="13" y="52" width="4" height="25" fill="#5a3e2b"/><rect x="83" y="50" width="4" height="27" fill="#5a3e2b"/><circle cx="20" cy="12" r="5" fill="#fde68a" opacity="0.5"/>',
  bg_guild_hall: '<rect width="100" height="100" fill="#2d1b4e"/><rect y="70" width="100" height="30" fill="#44337a"/><rect x="10" y="20" width="80" height="55" fill="#553c9a" rx="3"/><rect x="20" y="25" width="15" height="25" fill="#6b46c1" rx="2"/><rect x="65" y="25" width="15" height="25" fill="#6b46c1" rx="2"/><rect x="42" y="30" width="16" height="40" rx="2" fill="#4c1d95"/>',
  bg_castle: '<rect width="100" height="100" fill="#1e293b"/><rect y="65" width="100" height="35" fill="#475569"/><rect x="5" y="30" width="20" height="40" fill="#64748b"/><rect x="75" y="30" width="20" height="40" fill="#64748b"/><rect x="30" y="20" width="40" height="50" fill="#64748b"/><rect x="45" y="45" width="10" height="25" rx="5 5 0 0" fill="#334155"/><polygon points="8,30 15,15 22,30" fill="#64748b"/><polygon points="78,30 85,15 92,30" fill="#64748b"/>',
  bg_dungeon: '<rect width="100" height="100" fill="#0f172a"/><rect y="75" width="100" height="25" fill="#1e293b"/><rect x="5" y="10" width="8" height="70" fill="#334155"/><rect x="87" y="10" width="8" height="70" fill="#334155"/><circle cx="50" cy="15" r="3" fill="#f97316" opacity="0.5"><animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/></circle><circle cx="20" cy="25" r="2" fill="#f97316" opacity="0.3"><animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite"/></circle>',
  bg_dragon_lair: '<rect width="100" height="100" fill="#1c1917"/><rect y="70" width="100" height="30" fill="#292524"/><circle cx="50" cy="80" r="20" fill="#fbbf24" opacity="0.15"/><circle cx="40" cy="82" r="3" fill="#fbbf24" opacity="0.4"/><circle cx="60" cy="78" r="2" fill="#fbbf24" opacity="0.3"/><circle cx="55" cy="85" r="2.5" fill="#f59e0b" opacity="0.35"/><circle cx="30" cy="20" r="8" fill="#dc2626" opacity="0.1"><animate attributeName="r" values="6;10;6" dur="4s" repeatCount="indefinite"/></circle>',
  bg_sky_kingdom: '<rect width="100" height="100" fill="#1e3a5f"/><ellipse cx="25" cy="80" rx="30" ry="8" fill="#e2e8f0" opacity="0.3"/><ellipse cx="70" cy="70" rx="25" ry="6" fill="#e2e8f0" opacity="0.2"/><ellipse cx="50" cy="85" rx="40" ry="10" fill="#cbd5e1" opacity="0.25"/><circle cx="80" cy="15" r="8" fill="#fef3c7" opacity="0.6"/><circle cx="15" cy="12" r="1" fill="white" opacity="0.6"/><circle cx="35" cy="8" r="0.8" fill="white" opacity="0.5"/><circle cx="65" cy="5" r="1.2" fill="white" opacity="0.4"/>',
};

export default function AvatarRenderer({ avatar, size = 200, showBackground = true }) {
  if (!avatar) return null;

  const skin = avatar.skinTone || '#fde2c4';
  const skinDark = darken(skin, 20);
  const hair = avatar.hairColor || '#2c1810';
  const eye = avatar.eyeColor || '#4a3728';
  const expr = avatar.expression || 'neutral';
  const hairStyle = avatar.hairStyle || 'short';

  const bgKey = avatar.equippedBackground || 'default';
  const bgSvg = BACKGROUNDS[bgKey] || BACKGROUNDS.default;
  const auraSvg = avatar.equippedAura ? (AURA_EFFECTS[avatar.equippedAura] || '') : '';

  // Resolve equipment: use equipped items, fall back to class starter gear
  const cls = CHARACTER_CLASSES.find(c => c.id === avatar.class) || CHARACTER_CLASSES[0];
  const startGear = cls.startGear || {};
  const resolveGear = (slot) => avatar[slot] || startGear[slot.replace('equipped', '').toLowerCase()] || null;

  const headId = avatar.equippedHead || startGear.head || null;
  const weaponId = avatar.equippedWeapon || startGear.weapon || null;
  const backId = avatar.equippedBack || startGear.back || null;
  const armorId = avatar.equippedArmor || startGear.armor || null;

  const headSvg = headId ? (EQUIPMENT_OVERLAYS[headId] || '') : '';
  const weaponSvg = weaponId ? (EQUIPMENT_OVERLAYS[weaponId] || '') : '';
  const backSvg = backId ? (EQUIPMENT_OVERLAYS[backId] || '') : '';
  const armorSvg = armorId ? (EQUIPMENT_OVERLAYS[armorId] || '') : '';

  // Companion
  const companion = avatar.equippedCompanion ? COMPANION_SPRITES[avatar.equippedCompanion] : null;

  const hairGen = HAIR_SVG[hairStyle] || HAIR_SVG.short;
  const hairSvg = hairGen(hair);
  const eyeL = EYES[expr] ? EYES[expr](42, 42, eye) : EYES.neutral(42, 42, eye);
  const eyeR = EYES[expr] ? EYES[expr](58, 42, eye) : EYES.neutral(58, 42, eye);
  const mouth = MOUTHS[expr] ? MOUTHS[expr](50, 52) : MOUTHS.neutral(50, 52);

  const svgContent = `
    <defs>
      <radialGradient id="auraFire" cx="50%" cy="50%"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="transparent"/></radialGradient>
      <radialGradient id="auraGolden" cx="50%" cy="50%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>
    <!-- Background -->
    ${showBackground ? bgSvg : '<rect width="100" height="100" fill="#1e293b"/>'}
    <!-- Aura (behind character) -->
    ${auraSvg}
    <!-- Back equipment (cloaks, banners) -->
    ${backSvg}
    <!-- Body -->
    <rect x="42" y="58" width="16" height="22" rx="3" fill="${skin}"/>
    <!-- Legs -->
    <rect x="43" y="76" width="6" height="16" rx="2" fill="${skinDark}"/>
    <rect x="51" y="76" width="6" height="16" rx="2" fill="${skinDark}"/>
    <!-- Boots -->
    <rect x="41" y="88" width="9" height="5" rx="2" fill="#4a3728"/>
    <rect x="50" y="88" width="9" height="5" rx="2" fill="#4a3728"/>
    <!-- Arms -->
    <rect x="32" y="58" width="10" height="4" rx="2" fill="${skin}"/>
    <rect x="58" y="58" width="10" height="4" rx="2" fill="${skin}"/>
    <rect x="30" y="55" width="6" height="18" rx="3" fill="${skin}"/>
    <rect x="64" y="55" width="6" height="18" rx="3" fill="${skin}"/>
    <!-- Hands -->
    <circle cx="33" cy="73" r="3.5" fill="${skin}"/>
    <circle cx="67" cy="73" r="3.5" fill="${skin}"/>
    <!-- Armor/clothing overlay -->
    ${armorSvg || `<path d="M41,56 L41,74 L50,76 L59,74 L59,56 L55,54 L45,54 Z" fill="#6b7280" opacity="0.3"/>`}
    <!-- Weapon -->
    ${weaponSvg}
    <!-- Head -->
    <ellipse cx="50" cy="40" rx="16" ry="18" fill="${skin}"/>
    <!-- Ears -->
    <ellipse cx="34" cy="42" rx="3" ry="4" fill="${skinDark}"/>
    <ellipse cx="66" cy="42" rx="3" ry="4" fill="${skinDark}"/>
    <!-- Hair -->
    ${hairSvg}
    <!-- Eyes -->
    ${eyeL}
    ${eyeR}
    <!-- Nose -->
    <ellipse cx="50" cy="47" rx="1.5" ry="1" fill="${skinDark}" opacity="0.4"/>
    <!-- Mouth -->
    ${mouth}
    <!-- Head equipment -->
    ${headSvg}
    <!-- Companion -->
    ${companion ? `<text x="${companion.x}" y="${companion.y}" font-size="14">${companion.emoji}</text>` : ''}
  `;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="rounded-xl overflow-hidden"
        style={{ imageRendering: 'auto' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}
