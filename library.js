// ==================================================
// AI Dungeon Story Progression Framework
// ==================================================
// Generic template for automatic triggerword injection
//
// YOU ONLY EDIT THE 3 SECTIONS MARKED "⚙️ CUSTOMIZE THIS", all near the top:
//   1. Story Configuration  — your places, people, items, keywords
//   2. Trigger Definitions  — the bracketed beats the AI can be told
//   3. Rich Trigger Logic   — getRichTrigger(), where you wire it together
// Everything after those is engine plumbing you can safely ignore.

// ==================================================
// ⚙️ CUSTOMIZE THIS (1 of 3): Story Configuration
// ==================================================

const STORY_CONFIG = {
  // Your main companion's name (for relationship tracking)
  // Leave empty ('') if your story has no companion
  companionName: 'CompanionName',

  // Location tracking - add all your locations here
  // Required: keywords. Optional reward fields (all applied ONCE on first arrival):
  //   bondBonus        - added to companionBond
  //   explorationBonus - added to explorationLevel (advances story phase faster)
  //   moodOnArrival    - sets recentMood ('somber' | 'hopeful' | 'tense')
  //   intimacyBonus    - added to companionIntimacy (clamped 0-10)
  // Format: locationKey: { keywords: ['name', 'alt'], bondBonus: N, ...optional }
  locations: {
    location1: { keywords: ['location name', 'alternate'], bondBonus: 2 },
    location2: { keywords: ['second location'], bondBonus: 2, explorationBonus: 3 },
    location3: { keywords: ['third location'], bondBonus: 3, moodOnArrival: 'somber' },
    specialLocation: { keywords: ['special', 'intimate place'], bondBonus: 5, intimacyBonus: 2 },
    // Add more locations...
  },

  // Character tracking - list NPCs to track encounters with
  characters: ['Character1', 'Character2', 'Character3'],

  // Collectibles configuration
  collectibles: {
    primary: {
      name: 'PrimaryItem',
      keywords: ['primary', 'quest item'],
      max: 7,
      bondBonus: 3
    },
    secondary: {
      name: 'SecondaryItem',
      keywords: ['secondary', 'memory'],
      max: 10,
      bondBonus: 2
    }
  },

  // Behavior tracking keywords
  behaviorKeywords: {
    exploration: ['explore', 'search', 'investigate', 'examine', 'look around', 'venture', 'wander', 'walk', 'move', 'go', 'discover'],
    intimacy: ['hold', 'touch', 'close', 'together', 'embrace', 'comfort', 'trust'],
    memory: ['remember', 'memory', 'recall', 'familiar', 'flashback', 'recognition', 'past'],
    seeking: ['find', 'search for', 'looking for', 'seeking']
  },

  // Mood detection keywords
  moods: {
    somber: ['sad', 'grief', 'loss', 'mourn'],
    hopeful: ['hope', 'future', 'better', 'dream'],
    tense: ['danger', 'threat', 'attack', 'fear']
  }
};
// ➡️  NEXT: scroll down to section 2 (Trigger Definitions) to write the beats.

// ==================================================
// ⚙️ CUSTOMIZE THIS (2 of 3): Trigger Definitions
// ==================================================
// Use bracketed instructions that tell the AI what to do
// Format: "[Action the AI should take]"
// These are injected directly into context - no separate authors-note needed

const TRIGGERS = {
  // Location triggers - guide players to places
  location: {
    loc1: "[Guide toward LocationName1 with descriptive hints]",
    loc2: "[Guide toward LocationName2 with descriptive hints]",
    loc3: "[Guide toward LocationName3 with descriptive hints]",
    mystery: "[Unveil a new mystery or clue without forcing a specific path]"
  },

  // Exploration triggers - for discovering new areas
  exploration: {
    discover1: "[Reveal clues about DiscoveryLocation1]",
    discover2: "[Create pull toward DiscoveryLocation2]",
    discover3: "[Suggest DiscoveryLocation3 as interesting option]",
    discover4: "[Guide toward safe haven or rest area]"
  },

  // Relationship triggers - for companion bonding (only if companion exists)
  relationship: {
    intimacy: "[Create quiet moment between player and companion through vulnerability]",
    special: "[Guide toward intimate setting for exploring feelings]",
    sync: "[Emphasize moments where player and companion work as one]"
  },

  // Quest triggers - for collectibles and objectives
  quest: {
    collectible: "[Reveal opportunity to find a QuestItemName]",
    challenge: "[Introduce challenge requiring cooperation and skill]",
    revelation: "[Present revelation about the quest or world]"
  },

  // Character triggers - for NPC introductions
  character: {
    char1: "[Introduce Character1Name with their defining trait]",
    char2: "[Introduce Character2Name with their defining trait]",
    char3: "[Introduce Character3Name with their defining trait]"
  },

  // Emotional triggers - for mood-based moments
  emotional: {
    grief: "[Create somber scene exploring loss and grief]",
    hope: "[Craft hopeful moment with visions of better future]",
    crisis: "[Introduce moral dilemma testing character bonds]"
  }
};
// ➡️  NEXT: the real magic is section 3 (Rich Trigger Logic), just past the
//     config block below — that's where your places and beats get wired
//     together. Don't stop scrolling here!

// ==================================================
// CONFIGURATION (defaults; players override these via the settings card)
// ==================================================
// You normally DON'T hand-edit this — the auto-created "Progression Settings"
// story card drives these values. Listed here just so you can see the defaults.

const PROGRESSION_CONFIG = {
  minTurnsBetweenTriggers: 3,
  debugMode: false,
  explorationThresholdForFirstLocation: 2,
  explorationThresholdForSecondLocation: 5,
  maxPrimaryCollectibles: 7,
  maxSecondaryCollectibles: 10,
  strategy: 'rich',  // 'sequential', 'adaptive', 'random', or 'rich'
  pinSettingsCard: true  // keep the settings card near the top of the list
};

// ==================================================
// ⚙️ CUSTOMIZE THIS (3 of 3): Rich Trigger Logic
// ==================================================
// THIS FUNCTION IS THE HEART OF THE FRAMEWORK.
// It is where you WIRE PLACES TO BEATS:
//   - progression.visitedLocations.<key>  comes from STORY_CONFIG.locations
//   - progression.metCharacters.<Name>    comes from STORY_CONFIG.characters
//   - the value you RETURN                 comes from TRIGGERS
// Read each branch as: "GIVEN this state, INJECT this beat."
// The location/trigger vocabularies are intentionally separate — this is
// the ONE place they meet, so one location can be guided by different beats
// depending on phase, mood, or bond.
//
// IMPORTANT: the keys checked below (location1, location2, location3,
// Character1) must EXIST in STORY_CONFIG. The shipped defaults already
// include them. If you RENAME your locations/characters, rename them here
// too, or these branches silently never fire.

function getRichTrigger(progression) {
  // HIGHEST PRIORITY: Intimate moments (only if companion exists)
  if (STORY_CONFIG.companionName && progression.companionIntimacy >= 5 && progression.turnsSinceLastIntimacy >= 8 && progression.companionBond >= 15) {
    if (Math.random() < 0.3) {
      return TRIGGERS.relationship.intimacy;
    }
  }

  // HIGH PRIORITY: Collectible seeking
  if (progression.seekingPrimary && progression.turnsSinceLastTrigger >= 4) {
    if (progression.primaryCollected < PROGRESSION_CONFIG.maxPrimaryCollectibles) {
      return TRIGGERS.quest.collectible;
    }
  }

  // EARLY GAME: Guide to first locations
  // WIRING: place 'location1' (config) --unvisited--> beat 'loc1' (triggers).
  // Once location1 is visited, the second branch guides toward 'location2'.
  if (progression.storyPhase === 'early') {
    if (!progression.visitedLocations.location1 && progression.explorationLevel >= 2) {
      return TRIGGERS.location.loc1;
    }
    if (progression.visitedLocations.location1 && !progression.visitedLocations.location2 && progression.explorationLevel >= 5) {
      return TRIGGERS.location.loc2;
    }
  }

  // MID GAME: Exploration and characters
  // WIRING: character 'Character1' (config) --not yet met--> beat 'char1' (triggers).
  if (progression.storyPhase === 'mid') {
    if (!progression.metCharacters.Character1 && Math.random() < 0.4) {
      return TRIGGERS.character.char1;
    }
  }

  // LATE GAME: Advanced content
  // WIRING: place 'location3' --unvisited & enough primaries collected--> beat 'loc3'.
  if (progression.storyPhase === 'late') {
    if (!progression.visitedLocations.location3 && progression.primaryCollected >= 3) {
      return TRIGGERS.location.loc3;
    }
  }

  // MOOD-BASED TRIGGERS
  if (progression.recentMood === 'somber') {
    return TRIGGERS.emotional.grief;
  }
  if (progression.recentMood === 'hopeful') {
    return TRIGGERS.emotional.hope;
  }
  if (progression.recentMood === 'tense') {
    return TRIGGERS.emotional.crisis;
  }

  // FALLBACK
  if (progression.turnsSinceLastTrigger >= 5) {
    return TRIGGERS.location.mystery;
  }

  return null;
}

// ==================================================
// Everything below is engine plumbing — most authors never touch it.
// ==================================================

// ==================================================
// Settings Story Card (auto-created & auto-read)
// ==================================================
// Identity of the settings card. It is located by KEYS (case-insensitive
// substring), so the title can be anything as long as the keys contain this.
const SETTINGS_CARD_KEYS = 'progression settings';
const SETTINGS_CARD_TITLE = 'Progression Settings';

// Maps a "squashed" label (lowercased, non-alphanumerics removed) to the
// PROGRESSION_CONFIG field it controls. Because we squash before matching,
// "Max Primary Collectibles", "max primary collectibles", and even
// "Max-Primary_Collectibles!" all resolve to the same setting. Add a row here
// to expose a new setting on the card — no per-setting regex needed.
const SETTINGS_MAP = {
  triggerpacing:              'minTurnsBetweenTriggers',
  debugmode:                  'debugMode',
  firstlocationafter:         'explorationThresholdForFirstLocation',
  secondlocationafter:        'explorationThresholdForSecondLocation',
  maxprimarycollectibles:     'maxPrimaryCollectibles',
  maxsecondarycollectibles:   'maxSecondaryCollectibles',
  strategy:                   'strategy',
  pinsettingscardnearthetop:  'pinSettingsCard'
};

const VALID_STRATEGIES = ['sequential', 'adaptive', 'random', 'rich'];

// The default entry shown to (and edited by) the player. One "Label: value"
// per line; lines starting with # are ignored (use them for notes).
function getSettingsCardEntry() {
  return [
    '# Lines starting with # are ignored (use them for notes)',
    'Trigger Pacing: ' + PROGRESSION_CONFIG.minTurnsBetweenTriggers,
    'Debug Mode: ' + (PROGRESSION_CONFIG.debugMode ? 'Enabled' : 'Disabled'),
    'First Location After: ' + PROGRESSION_CONFIG.explorationThresholdForFirstLocation,
    'Second Location After: ' + PROGRESSION_CONFIG.explorationThresholdForSecondLocation,
    'Max Primary Collectibles: ' + PROGRESSION_CONFIG.maxPrimaryCollectibles,
    'Max Secondary Collectibles: ' + PROGRESSION_CONFIG.maxSecondaryCollectibles,
    'Strategy: ' + PROGRESSION_CONFIG.strategy,
    'Pin Settings Card Near The Top: ' + PROGRESSION_CONFIG.pinSettingsCard,
    '',
    '# Lower pacing = faster story, higher = slower',
    '# Strategies: Sequential, Adaptive, Random, Rich',
    '# Debug Mode: Enabled shows live progression metrics'
  ].join('\n');
}

// The list of story cards, under either the modern or legacy global name.
function getStoryCards() {
  if (typeof storyCards !== 'undefined' && Array.isArray(storyCards)) return storyCards;
  if (typeof worldInfo !== 'undefined' && Array.isArray(worldInfo)) return worldInfo;
  return null;
}

// Locate our settings card by keys (case-insensitive substring match).
function findSettingsCard() {
  const cards = getStoryCards();
  if (!cards) return null;
  return cards.find(card => card && card.keys &&
    String(card.keys).toLowerCase().includes(SETTINGS_CARD_KEYS)) || null;
}

// Create the settings card if it doesn't exist yet, using AI Dungeon's
// addStoryCard() global. Returns the card, or null if the API is unavailable
// (e.g. during local testing) so callers can degrade gracefully.
function ensureSettingsCard() {
  let card = findSettingsCard();
  if (card) return card;

  const cards = getStoryCards();
  if (!cards || typeof addStoryCard === 'undefined') return null;

  // AI Dungeon idiom: append a blank sentinel card, then find and populate it.
  addStoryCard('%@%');
  card = cards.find(c => c && c.title === '%@%');
  if (!card) return null;

  card.type = 'progression';
  card.title = SETTINGS_CARD_TITLE;
  card.keys = SETTINGS_CARD_KEYS;
  card.entry = getSettingsCardEntry();
  card.description = [
    'Auto-generated by the Story Progression Framework.',
    'Edit the values in the entry above to tune pacing, strategy, and limits.',
    '',
    'Card-pinning technique adapted from LewdLeah\'s Auto-Cards',
    '(github.com/LewdLeah/Auto-Cards). Thanks!'
  ].join('\n');
  return card;
}

// Generic parser: normalize the entry, split into "key: value" pairs, and
// coerce each value to boolean / integer / known string. Modeled on the
// Auto-Cards approach — tolerant of spacing and punctuation.
function parseSettings(entryText) {
  const settings = {};
  if (!entryText) return settings;

  // Drop comment lines (starting with #) first, then process line by line.
  const lines = String(entryText)
    .split('\n')
    .filter(line => !line.trim().startsWith('#'));

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;

    // Squash the key: lowercase and strip everything but a-z0-9.
    const rawKey = line.slice(0, idx);
    const key = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || !SETTINGS_MAP.hasOwnProperty(key)) continue;

    const rawValue = line.slice(idx + 1).trim();
    const lowerValue = rawValue.toLowerCase();

    let value;
    const intMatch = rawValue.match(/-?\d+/); // first integer anywhere in the value
    if (['true', 'enabled', 'on', 'yes'].includes(lowerValue)) {
      value = true;
    } else if (['false', 'disabled', 'off', 'no'].includes(lowerValue)) {
      value = false;
    } else if (intMatch) {
      // Tolerate trailing/leading text, e.g. "2 actions" -> 2 (matches the
      // documented card format and the original parser's behavior).
      value = parseInt(intMatch[0], 10);
    } else {
      value = lowerValue; // keep as string (e.g. strategy names)
    }

    settings[SETTINGS_MAP[key]] = value;
  }

  return settings;
}

// Config fields that are booleans (validated as such when applying settings).
const BOOLEAN_SETTINGS = ['debugMode', 'pinSettingsCard'];

// Apply a parsed settings object onto PROGRESSION_CONFIG, validating types.
function applySettings(settings) {
  for (const [configKey, value] of Object.entries(settings)) {
    if (configKey === 'strategy') {
      if (typeof value === 'string' && VALID_STRATEGIES.includes(value)) {
        PROGRESSION_CONFIG.strategy = value;
      }
    } else if (BOOLEAN_SETTINGS.includes(configKey)) {
      if (typeof value === 'boolean') PROGRESSION_CONFIG[configKey] = value;
    } else if (typeof value === 'number' && value >= 0) {
      // All remaining settings are non-negative integers.
      PROGRESSION_CONFIG[configKey] = value;
    }
  }
}

// Move the settings card to the top of the story-cards list (index 0). AI
// Dungeon renders cards in array order, so this "pins" it near the top.
//
// Array-reordering technique (splice out, unshift to front) courtesy of
// LewdLeah's Auto-Cards (github.com/LewdLeah/Auto-Cards) — see pinAndSortCards.
function pinSettingsCard(card) {
  const cards = getStoryCards();
  if (!cards || !card) return;
  const index = cards.indexOf(card);
  if (index > 0) {              // already at the top (or not found)? nothing to do
    cards.splice(index, 1);
    cards.unshift(card);
  }
}

// Ensure the settings card exists, then read it into PROGRESSION_CONFIG.
function loadConfigFromWorldInfo() {
  const card = ensureSettingsCard();
  if (card && card.entry) {
    applySettings(parseSettings(card.entry));
  }
  // Re-pin each turn only while the setting is on, so a player who turns it
  // off (or manually moves the card) isn't overridden on the next turn.
  if (card && PROGRESSION_CONFIG.pinSettingsCard) {
    pinSettingsCard(card);
  }
}

// ==================================================
// CORE SYSTEM (Don't modify unless you know what you're doing)
// ==================================================

function StoryProgression(modifierType, text) {
  loadConfigFromWorldInfo();

  if (!state.memory.storyProgression) {
    initializeProgressionState();
  }

  const progression = state.memory.storyProgression;

  switch (modifierType) {
    case 'input':
      return handleInputModifier(text, progression);
    case 'context':
      return handleContextModifier(text, progression);
    case 'output':
      return handleOutputModifier(text, progression);
    default:
      return { text: text };
  }
}

function initializeProgressionState() {
  state.memory.storyProgression = {
    // Location tracking (auto-generated from STORY_CONFIG)
    visitedLocations: {},

    // Turn and trigger tracking
    turnsSinceLastTrigger: 0,
    turnsSinceLastIntimacy: 0,
    totalTurns: 0,
    lastTriggerUsed: null,
    triggerHistory: [],

    // Player behavior tracking
    primaryCollected: 0,
    secondaryCollected: 0,
    explorationLevel: 0,
    companionInteractionCount: 0,
    emotionalMoments: 0,

    // Character encounters
    metCharacters: {},

    // Relationship tracking
    companionIntimacy: 0,  // 0-10 scale
    companionBond: 0,      // Increases with shared experiences

    // Story phase
    storyPhase: 'early',

    // Mood tracking
    recentMood: 'neutral',

    // Debug info
    debugLog: []
  };

  // Initialize location tracking
  Object.keys(STORY_CONFIG.locations).forEach(key => {
    state.memory.storyProgression.visitedLocations[key] = false;
  });

  // Initialize character tracking
  STORY_CONFIG.characters.forEach(char => {
    state.memory.storyProgression.metCharacters[char] = false;
  });
}

function handleInputModifier(text, progression) {
  const lowerText = text.toLowerCase();

  // Track exploration
  if (STORY_CONFIG.behaviorKeywords.exploration.some(keyword => lowerText.includes(keyword))) {
    progression.explorationLevel++;
    logDebug(progression, `Exploration +1 (${progression.explorationLevel})`);
  }

  // Track companion interactions (only if companion exists)
  if (STORY_CONFIG.companionName && lowerText.includes(STORY_CONFIG.companionName.toLowerCase())) {
    progression.companionInteractionCount++;
    logDebug(progression, `Companion interaction +1`);
  }

  // Track intimacy
  if (STORY_CONFIG.behaviorKeywords.intimacy.some(keyword => lowerText.includes(keyword))) {
    progression.companionIntimacy = Math.min(10, progression.companionIntimacy + 1);
    progression.emotionalMoments++;
    logDebug(progression, `Intimacy +1 (level ${progression.companionIntimacy})`);
  }

  // Track collectible seeking
  if (STORY_CONFIG.behaviorKeywords.seeking.some(keyword => lowerText.includes(keyword))) {
    if (STORY_CONFIG.collectibles.primary.keywords.some(k => lowerText.includes(k))) {
      progression.seekingPrimary = true;
    }
  }

  // Detect mood
  for (const [mood, keywords] of Object.entries(STORY_CONFIG.moods)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      progression.recentMood = mood;
      break;
    }
  }

  progression.totalTurns++;
  progression.turnsSinceLastTrigger++;
  progression.turnsSinceLastIntimacy++;

  updateStoryPhase(progression);
  updateCompanionBond(progression);

  state.memory.storyProgression = progression;
  return { text: text };
}

function handleContextModifier(text, progression) {
  let modifiedText = text;
  let triggerToInject = null;

  if (progression.turnsSinceLastTrigger >= PROGRESSION_CONFIG.minTurnsBetweenTriggers) {
    switch (PROGRESSION_CONFIG.strategy) {
      case 'sequential':
        triggerToInject = getSequentialTrigger(progression);
        break;
      case 'adaptive':
        triggerToInject = getAdaptiveTrigger(progression);
        break;
      case 'random':
        triggerToInject = getRandomTrigger(progression);
        break;
      case 'rich':
        triggerToInject = getRichTrigger(progression);
        break;
    }

    if (triggerToInject) {
      modifiedText = triggerToInject + "\n\n" + modifiedText;
      progression.lastTriggerUsed = triggerToInject;
      progression.turnsSinceLastTrigger = 0;

      if ([TRIGGERS.relationship.intimacy, TRIGGERS.relationship.special, TRIGGERS.relationship.sync].includes(triggerToInject)) {
        progression.turnsSinceLastIntimacy = 0;
      }

      progression.triggerHistory.push(triggerToInject);
      if (progression.triggerHistory.length > 10) {
        progression.triggerHistory.shift();
      }

      logDebug(progression, `Injected: ${triggerToInject}`);
    }
  }

  if (PROGRESSION_CONFIG.debugMode && progression.debugLog.length > 0) {
    const debugMessage = `[PROG] ${progression.debugLog.join(' | ')} | Phase: ${progression.storyPhase} | Bond: ${progression.companionBond}`;
    state.message = debugMessage;
    progression.debugLog = [];
  }

  state.memory.storyProgression = progression;
  return { text: modifiedText };
}

function handleOutputModifier(text, progression) {
  const lowerText = text.toLowerCase();

  // Detect location arrivals
  // On the FIRST arrival at a place, apply its optional reward fields.
  // Each field is guarded so a location that omits it is fine (adds 0 / no-op).
  for (const [key, location] of Object.entries(STORY_CONFIG.locations)) {
    if (!progression.visitedLocations[key]) {
      if (location.keywords.some(keyword => lowerText.includes(keyword))) {
        progression.visitedLocations[key] = true;

        // bondBonus: added to companionBond (guarded so a missing value can't produce NaN)
        progression.companionBond += (location.bondBonus || 0);

        // explorationBonus: reaching this place advances the story phase faster
        if (location.explorationBonus) {
          progression.explorationLevel += location.explorationBonus;
        }

        // moodOnArrival: this place sets the emotional tone (Rich strategy reads recentMood)
        if (location.moodOnArrival) {
          progression.recentMood = location.moodOnArrival;
        }

        // intimacyBonus: quiet/romantic places deepen the bond (clamped to the 0-10 scale)
        if (location.intimacyBonus) {
          progression.companionIntimacy = Math.min(10, progression.companionIntimacy + location.intimacyBonus);
        }

        logDebug(progression, `Arrived at ${key}`);
      }
    }
  }

  // Detect character encounters
  STORY_CONFIG.characters.forEach(char => {
    if (!progression.metCharacters[char] && lowerText.includes(char.toLowerCase())) {
      progression.metCharacters[char] = true;
      logDebug(progression, `Met ${char}`);
    }
  });

  // Detect collectible collection
  if (STORY_CONFIG.collectibles.primary.keywords.some(k => lowerText.includes(k))) {
    if (progression.primaryCollected < PROGRESSION_CONFIG.maxPrimaryCollectibles) {
      progression.primaryCollected++;
      progression.companionBond += STORY_CONFIG.collectibles.primary.bondBonus;
      logDebug(progression, `Primary collected (${progression.primaryCollected}/${PROGRESSION_CONFIG.maxPrimaryCollectibles})`);
    }
  }

  state.memory.storyProgression = progression;
  return { text: text };
}

// ==================================================
// Legacy Strategies (Usually don't need modification)
// ==================================================

function getSequentialTrigger(progression) {
  const locationKeys = Object.keys(STORY_CONFIG.locations);

  for (let i = 0; i < locationKeys.length; i++) {
    const key = locationKeys[i];
    if (!progression.visitedLocations[key]) {
      const threshold = i === 0 ? PROGRESSION_CONFIG.explorationThresholdForFirstLocation : PROGRESSION_CONFIG.explorationThresholdForSecondLocation;
      if (progression.explorationLevel >= threshold) {
        return TRIGGERS.location[`loc${i + 1}`] || TRIGGERS.location.mystery;
      }
    }
  }

  if (progression.turnsSinceLastTrigger >= 5) {
    return TRIGGERS.location.mystery;
  }

  return null;
}

function getAdaptiveTrigger(progression) {
  // Similar to sequential but adjusts based on player focus
  if (STORY_CONFIG.companionName && progression.companionInteractionCount > progression.explorationLevel * 2) {
    return TRIGGERS.relationship.intimacy;
  }

  return getSequentialTrigger(progression);
}

function getRandomTrigger(progression) {
  if (progression.turnsSinceLastTrigger < 3) return null;

  const triggers = [];
  const allTriggers = Object.values(TRIGGERS).flatMap(category => Object.values(category));

  allTriggers.forEach(trigger => triggers.push(trigger));

  const randomIndex = Math.floor(Math.random() * triggers.length);
  return triggers[randomIndex];
}

// ==================================================
// Helper Functions
// ==================================================

function updateStoryPhase(progression) {
  if (progression.primaryCollected >= 5 || progression.companionBond >= 30) {
    progression.storyPhase = 'endgame';
  } else if (progression.explorationLevel >= 15 || progression.companionBond >= 20) {
    progression.storyPhase = 'late';
  } else if (progression.explorationLevel >= 8) {
    progression.storyPhase = 'mid';
  } else {
    progression.storyPhase = 'early';
  }
}

function updateCompanionBond(progression) {
  // Only update companion bond if companion exists
  if (!STORY_CONFIG.companionName) return;

  if (progression.totalTurns % 5 === 0) {
    progression.companionBond++;
  }

  if (progression.companionIntimacy >= 5) {
    progression.companionBond = Math.max(progression.companionBond, 15);
  }
}

function logDebug(progression, message) {
  if (PROGRESSION_CONFIG.debugMode) {
    progression.debugLog.push(message);
  }
}

// ==================================================
// Exports
// ==================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StoryProgression, TRIGGERS, PROGRESSION_CONFIG,
    // exposed for testing
    parseSettings, applySettings, findSettingsCard, ensureSettingsCard,
    getSettingsCardEntry, loadConfigFromWorldInfo, getRichTrigger,
    getSequentialTrigger, pinSettingsCard
  };
}
