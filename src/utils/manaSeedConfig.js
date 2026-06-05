export const SKIN_TO_VARIANT = {
  '#fde2c4': 'v00',
  '#f5c7a1': 'v01',
  '#d4a373': 'v03',
  '#a67c52': 'v05',
  '#6b4423': 'v08',
  '#3d2b1f': 'v10',
};

export const HAIR_STYLE_TO_TYPE = {
  short:    'bob1',
  medium:   'bob1',
  long:     'dap1',
  ponytail: 'dap1',
  mohawk:   null,
  bald:     null,
};

export const HAIR_COLOR_TO_VARIANT = {
  '#2c1810': 'v00',
  '#5a3825': 'v01',
  '#8b6914': 'v03',
  '#d4a017': 'v05',
  '#c0392b': 'v07',
  '#2980b9': 'v09',
  '#8e44ad': 'v11',
  '#ecf0f1': 'v13',
};

export const OUTFIT_DEFAULT = { type: 'pfpn', variant: 'v01' };

export const EQUIPMENT_SPRITE_MAP = {
  starter_sword:     { page: 'pONE1', layer: '6tla', type: 'sw01', variant: 'v01' },
  eq_wooden_sword:   { page: 'pONE1', layer: '6tla', type: 'sw01', variant: 'v02' },
  eq_fire_sword:     { page: 'pONE1', layer: '6tla', type: 'sw01', variant: 'v04' },
  eq_katana:         { page: 'pONE1', layer: '6tla', type: 'sw01', variant: 'v05' },
  eq_battle_axe:     { page: 'pONE1', layer: '6tla', type: 'ax01', variant: 'v01' },
  eq_war_hammer:     { page: 'pONE1', layer: '6tla', type: 'ax01', variant: 'v03' },
  eq_crystal_wand:   { page: 'pONE1', layer: '6tla', type: 'mc01', variant: 'v01' },
  eq_staff_wisdom:   { page: 'pONE1', layer: '6tla', type: 'mc01', variant: 'v03' },
  eq_royal_scepter:  { page: 'pONE1', layer: '6tla', type: 'mc01', variant: 'v05' },
  starter_staff:     { page: 'pONE1', layer: '6tla', type: 'mc01', variant: 'v02' },
};

export const HAT_SPRITE_MAP = {
  eq_ranger_cap:  { page: 'p1', layer: '5hat', type: 'pfht', variant: 'v01', hidesHair: false },
  eq_wizard_hat:  { page: 'p1', layer: '5hat', type: 'pnty', variant: 'v01', hidesHair: false },
};

export function getBasePath(skinTone, hasWeaponSprite) {
  const variant = SKIN_TO_VARIANT[skinTone] || 'v00';
  const page = hasWeaponSprite ? 'pONE1' : 'p1';
  return `/sprites/mana-seed/${page}/0bas/char_a_${page}_0bas_humn_${variant}.png`;
}

export function getOutfitPath(hasWeaponSprite) {
  const page = hasWeaponSprite ? 'pONE1' : 'p1';
  const { type, variant } = OUTFIT_DEFAULT;
  return `/sprites/mana-seed/${page}/1out/char_a_${page}_1out_${type}_${variant}.png`;
}

export function getHairPath(hairStyle, hairColor, hasWeaponSprite) {
  const type = HAIR_STYLE_TO_TYPE[hairStyle];
  if (!type) return null;
  const variant = HAIR_COLOR_TO_VARIANT[hairColor] || 'v00';
  const page = hasWeaponSprite ? 'pONE1' : 'p1';
  return `/sprites/mana-seed/${page}/4har/char_a_${page}_4har_${type}_${variant}.png`;
}

export function getEquipmentPath(itemId) {
  const entry = EQUIPMENT_SPRITE_MAP[itemId];
  if (!entry) return null;
  return `/sprites/mana-seed/${entry.page}/${entry.layer}/char_a_${entry.page}_${entry.layer}_${entry.type}_${entry.variant}.png`;
}

export function getHatPath(itemId) {
  const entry = HAT_SPRITE_MAP[itemId];
  if (!entry) return null;
  return {
    path: `/sprites/mana-seed/${entry.page}/${entry.layer}/char_a_${entry.page}_${entry.layer}_${entry.type}_${entry.variant}.png`,
    hidesHair: entry.hidesHair,
  };
}
