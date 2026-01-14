// data/spells.js
// Central registry for spell references used by hydrateSpellRefs.
// Keys should match your HTML, example: <span data-spell="stormstrike"></span>

const ZAMIMG_BASE = "https://wow.zamimg.com/images/wow/icons"

export function iconUrl(iconName, size = "large", ext = "jpg") {
  return `${ZAMIMG_BASE}/${size}/${iconName}.${ext}`
}

const UNKNOWN_ICON = iconUrl("inv_misc_questionmark")

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

  // Raid buffs on you
  blessing_of_kings: { name: "Blessing of Kings", icon: iconUrl("spell_magic_magearmor") },
  mark_of_the_wild: { name: "Mark of the Wild", icon: iconUrl("spell_nature_regeneration") },
  power_word_fortitude: { name: "Power Word: Fortitude", icon: iconUrl("spell_holy_wordfortitude") },
  divine_spirit: { name: "Divine Spirit", icon: iconUrl("spell_holy_divinespirit") },
  arcane_intellect: { name: "Arcane Intellect", icon: iconUrl("spell_holy_magicalsentry") },

  blessing_of_might: { name: "Blessing of Might", icon: iconUrl("spell_holy_fistofjustice") },
  battle_shout: { name: "Battle Shout", icon: iconUrl("ability_warrior_battleshout") },
  trueshot_aura: { name: "Trueshot Aura", icon: iconUrl("ability_trueshot") },

  // Crit support
  leader_of_the_pack: { name: "Leader of the Pack", icon: iconUrl("spell_nature_unyeildingstamina") },
  rampage: { name: "Rampage", icon: iconUrl("ability_warrior_rampage") },

  // Haste windows
  bloodlust: { name: "Bloodlust", icon: iconUrl("spell_nature_bloodlust") },
  heroism: { name: "Heroism", icon: iconUrl("spell_nature_bloodlust") },

  // Sustain
  blessing_of_wisdom: { name: "Blessing of Wisdom", icon: iconUrl("spell_holy_sealofwisdom") },

  // Raid debuffs on the boss
  sunder_armor: { name: "Sunder Armor", icon: iconUrl("ability_warrior_sunder") },
  expose_armor: { name: "Expose Armor", icon: iconUrl("ability_warrior_riposte") },
  faerie_fire: { name: "Faerie Fire", icon: iconUrl("spell_nature_faeriefire") },
  improved_faerie_fire: { name: "Improved Faerie Fire", icon: iconUrl("spell_nature_faeriefire") },
  curse_of_recklessness: { name: "Curse of Recklessness", icon: iconUrl("spell_shadow_unholystrength") },
  idol_of_the_raven_goddess: { name: "Idol of the Raven Goddess", icon: iconUrl("inv-mount_raven_54") },


  // Physical damage taken amplifiers and related effects
  blood_frenzy: { name: "Blood Frenzy", icon: iconUrl("ability_warrior_bloodfrenzy") },
  savage_combat: { name: "Savage Combat", icon: iconUrl("ability_creature_disease_03") },
  expose_weakness: { name: "Expose Weakness", icon: iconUrl("ability_rogue_findweakness") },
  moonkin_aura: { name: "Moonkin Aura", icon: iconUrl("spell_nature_moonglow") },

  // Spell reliability and magic amplification
  misery: { name: "Misery", icon: iconUrl("spell_shadow_misery") },
  curse_of_the_elements: { name: "Curse of the Elements", icon: iconUrl("spell_shadow_chilltouch") },
  improved_scorch: { name: "Improved Scorch", icon: iconUrl("spell_fire_soulburn") },

  // Profession and item based boosters
  drums_of_battle: { name: "Drums of Battle", icon: iconUrl("inv_misc_drum_02") },
  drums_of_war: { name: "Drums of War", icon: iconUrl("inv_misc_drum_03") },

  // Consumables and scrolls (safe defaults, swap icons later if you want)
  flask_of_relentless_assault: { name: "Flask of Relentless Assault", icon: UNKNOWN_ICON },
  elixir_of_major_agility: { name: "Elixir of Major Agility", icon: UNKNOWN_ICON },
  scroll_of_strength: { name: "Scroll of Strength", icon: UNKNOWN_ICON },
  elemental_sharpening_stone: { name: "Elemental Sharpening Stone", icon: UNKNOWN_ICON },
}

// Totem slot registry for generic references plus a default spell per slot
export const TOTEMS = {
  air: {
    name: "Air Totem",
    icon: iconUrl("spell_totem_wardofdraining"),
    defaultSpell: "windfury_totem",
    options: [
      "windfury_totem",
      "grace_of_air_totem",
      "tranquil_air_totem",
      "grounding_totem",
      "wrath_of_air_totem",
    ],
  },
  fire: {
    name: "Fire Totem",
    icon: iconUrl("spell_totem_wardofdraining"),
    defaultSpell: "searing_totem",
    options: ["searing_totem", "fire_nova_totem", "magma_totem", "totem_of_wrath"],
  },
}
