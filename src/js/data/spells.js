// data/spells.js (or wherever your SPELLS live)
const ZAMIMG_BASE = "https://wow.zamimg.com/images/wow/icons";

export function iconUrl(iconName, size = "large", ext = "jpg") {
  return `${ZAMIMG_BASE}/${size}/${iconName}.${ext}`;
}

export const SPELLS = {
  flurry: {
    name: "Flurry",
    icon: iconUrl("ability_ghoulfrenzy"),
  },
  windfury_weapon: {
    name: "Windfury Weapon",
    icon: iconUrl("spell_nature_cyclone"),
  },
  stormstrike: {
    name: "Stormstrike",
    icon: iconUrl("ability_shaman_stormstrike"),
  },
};
