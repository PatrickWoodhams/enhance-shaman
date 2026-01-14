// data/spells.js
// Central registry for spell references used by hydrateSpellRefs.
// Keys should match your HTML, example: <span data-spell="stormstrike"></span>

const ZAMIMG_BASE = "https://wow.zamimg.com/images/wow/icons"

export function iconUrl(iconName, size = "large", ext = "jpg") {
  return `${ZAMIMG_BASE}/${size}/${iconName}.${ext}`
}

export const SPELLS = {
  // Enhancement core
  stormstrike: { name: "Stormstrike", icon: iconUrl("ability_shaman_stormstrike") },
  shamanistic_rage: { name: "Shamanistic Rage", icon: iconUrl("spell_nature_shamanrage") },
  feral_spirit: { name: "Feral Spirit", icon: iconUrl("spell_shaman_feralspirit") },
  dual_wield: { name: "Dual Wield", icon: iconUrl("ability_dualwield") },
  improved_fire_totems: { name: "Improved Fire Totems", icon: iconUrl("spell_fire_sealoffire") },
  improved_ghost_wolf: { name: "Improved Ghost Wolf", icon: iconUrl("spell_nature_spiritwolf") },
  guardian_totems: { name: "Guardian Totems", icon: iconUrl("spell_nature_stoneskintotem") },
  totemic_focus: { name: "Totemic Focus", icon: iconUrl("spell_nature_moonglow") },
  call_of_flames: { name: "Call of Flames", icon: iconUrl("spell_fire_immolation") },
  totemic_mastery: { name: "Totemic Mastery", icon: iconUrl("spell_nature_nullward") },
  improved_weapon_totems: { name: "Improved Weapon Totems", icon: iconUrl("spell_fire_enchantweapon") },
  natures_guidance: { name: "Nature's Guidance", icon: iconUrl("spell_frost_stun") },
  clearcasting: { name: "Clearcasting", icon: iconUrl("spell_shadow_manaburn") },
  
  // Talents and procs
  flurry: { name: "Flurry", icon: iconUrl("ability_ghoulfrenzy") },
  unleashed_rage: { name: "Unleashed Rage", icon: iconUrl("spell_nature_unleashedrage") },
  elemental_devastation: { name: "Elemental Devastation", icon: iconUrl("spell_fire_elementaldevastation") },

  // Weapon imbues
  windfury_weapon: { name: "Windfury Weapon", icon: iconUrl("spell_nature_cyclone") },
  flametongue_weapon: { name: "Flametongue Weapon", icon: iconUrl("spell_fire_flametounge") },
  frostbrand_weapon: { name: "Frostbrand Weapon", icon: iconUrl("spell_frost_frostbrand") },
  rockbiter_weapon: { name: "Rockbiter Weapon", icon: iconUrl("spell_nature_rockbiter") },

  // Shocks
  earth_shock: { name: "Earth Shock", icon: iconUrl("spell_nature_earthshock") },
  frost_shock: { name: "Frost Shock", icon: iconUrl("spell_frost_frostshock") },
  flame_shock: { name: "Flame Shock", icon: iconUrl("spell_fire_flameshock") },

  // Air totems
  air_totem: { name: "Air Totem", icon: iconUrl("spell_totem_wardofdraining") },
  windfury_totem: { name: "Windfury Totem", icon: iconUrl("spell_nature_windfury") },
  grace_of_air_totem: { name: "Grace of Air Totem", icon: iconUrl("spell_nature_invisibilitytotem") },
  tranquil_air_totem: { name: "Tranquil Air Totem", icon: iconUrl("spell_nature_brilliance") },
  grounding_totem: { name: "Grounding Totem", icon: iconUrl("spell_nature_groundingtotem") },
  wrath_of_air_totem: { name: "Wrath of Air Totem", icon: iconUrl("spell_nature_slowingtotem") },

  // Fire totems
  fire_totem: { name: "Fire Totem", icon: iconUrl("spell_totem_wardofdraining") },
  searing_totem: { name: "Searing Totem", icon: iconUrl("spell_fire_searingtotem") },
  fire_nova_totem: { name: "Fire Nova Totem", icon: iconUrl("spell_fire_sealoffire") },
  magma_totem: { name: "Magma Totem", icon: iconUrl("spell_fire_selfdestruct") },
  fire_resistance_totem: { name: "Fire Resistance Totem", icon: iconUrl("spell_fireresistancetotem_01") },
  fire_elemental_totem: { name: "Fire Elemental Totem", icon: iconUrl("spell_fire_elemental_totem") },
  totem_of_wrath: { name: "Totem of Wrath", icon: iconUrl("spell_fire_totemofwrath") },

  // Earth totems
  strength_of_earth_totem: { name: "Strength of Earth Totem", icon: iconUrl("spell_nature_earthbindtotem") },
  stoneskin_totem: { name: "Stoneskin Totem", icon: iconUrl("spell_nature_stoneskintotem") },
  earthbind_totem: { name: "Earthbind Totem", icon: iconUrl("spell_nature_strengthofearthtotem02") },
  tremor_totem: { name: "Tremor Totem", icon: iconUrl("spell_nature_tremortotem") },

  // Water totems
  mana_spring_totem: { name: "Mana Spring Totem", icon: iconUrl("spell_nature_manaregentotem") },
  healing_stream_totem: { name: "Healing Stream Totem", icon: iconUrl("spell_nature_healingstreamtotem") },
  poison_cleansing_totem: { name: "Poison Cleansing Totem", icon: iconUrl("spell_nature_poisoncleansingtotem") },
  disease_cleansing_totem: { name: "Disease Cleansing Totem", icon: iconUrl("spell_nature_diseasecleansingtotem") },
}

// Totem slot registry for generic references plus a default spell per slot
export const TOTEMS = {
  air: {
    name: "Air Totem",
    icon: iconUrl("spell_totem_wardofdraining"),
    defaultSpell: "windfury_totem",
    options: ["windfury_totem", "grace_of_air_totem", "tranquil_air_totem", "grounding_totem"],
  },
  fire: {
    name: "Fire Totem",
    icon: iconUrl("spell_totem_wardofdraining"),
    defaultSpell: "searing_totem",
    options: ["searing_totem", "fire_nova_totem", "magma_totem", "totem_of_wrath"],
  },
}
