// ==================================================
// EXAMPLE - The Lighthouse (filled in)
// ==================================================
// The Story Progression Framework with every blank filled in, so you can see
// what a finished one looks like before you write your own.
//
// The story: you wash up in a fog-bound fishing village called Sethvale with
// no memory of the wreck. Wren, a lamp-trimmer's daughter, has decided you are
// her problem now. Out on the headland the old lighthouse is still lit, and
// nobody in the village will say who is lighting it.
//
// Paste this whole file into the LIBRARY tab. input.js, context.js and
// output.js go in unchanged.
//
// Everything above "engine plumbing" is story. Everything after it is the same
// engine that ships in library.js, copied unchanged.

// ==================================================
// (1 of 3): Story Configuration - what exists
// ==================================================

const STORY_CONFIG = {
  // Wren travels with you, so relationship tracking is on.
  companionName: 'Wren',

  // The keys (location1, specialLocation, ...) are internal handles: they are
  // the names section 3 uses to ask "has the player been here yet?".
  // The keywords are matched against what the AI writes, so they have to be
  // words the AI will actually put on the page.
  locations: {
    // The old lighthouse on the headland - the story's first pull.
    location1: {
      keywords: ['lighthouse', 'old lighthouse', 'beacon'],
      bondBonus: 3
    },
    // The tide pools below the cliff. Getting down there is real exploring, so
    // arriving pushes the story toward its middle phase.
    location2: {
      keywords: ['tide pools', 'tidepools', 'rock pools'],
      bondBonus: 2,
      explorationBonus: 3
    },
    // The drowned chapel out on the sand flats. Arriving there should hurt.
    location3: {
      keywords: ['drowned chapel', 'flooded chapel', 'sunken chapel'],
      bondBonus: 3,
      moodOnArrival: 'somber'
    },
    // The lantern room - the quiet place. Note the keywords avoid the word
    // "lighthouse": location1 already owns it, and would swallow this one.
    specialLocation: {
      keywords: ['lantern room', 'lamp room', 'top of the stairs'],
      bondBonus: 5,
      intimacyBonus: 2
    },
    // The harbour. Somewhere to keep coming back to, and getting there counts
    // as real exploring.
    harbour: {
      keywords: ['harbour', 'harbor', 'quayside'],
      bondBonus: 1,
      explorationBonus: 2
    }
  },

  // Names the engine watches for in the AI's text. The first time one shows
  // up, that character counts as met.
  characters: ['Halloran', 'Sable', 'Muirin'],

  // Things to collect. Primary drives the quest; secondary is flavour.
  collectibles: {
    primary: {
      name: 'Journal Page',
      keywords: ['journal page', 'torn page', 'water-stained page'],
      max: 7,
      bondBonus: 3
    },
    secondary: {
      name: 'Sea Glass',
      keywords: ['sea glass', 'green glass'],
      max: 10,
      bondBonus: 2
    }
  },

  // These read the PLAYER's typing, not the AI's. They are how the engine
  // works out what kind of player you are being this turn.
  behaviorKeywords: {
    exploration: ['explore', 'search', 'investigate', 'examine', 'look around', 'climb', 'follow', 'wander', 'head toward', 'walk'],
    intimacy: ['hold', 'touch', 'close', 'together', 'embrace', 'comfort', 'trust'],
    memory: ['remember', 'memory', 'recall', 'familiar', 'before the wreck', 'recognise', 'recognize'],
    seeking: ['find', 'search for', 'looking for', 'seeking', 'hunt for']
  },

  // Mood words, also read from the player's typing. Section 3 reacts to them.
  moods: {
    somber: ['sad', 'grief', 'mourn', 'drowned', 'funeral'],
    hopeful: ['hope', 'home', 'better', 'morning', 'promise'],
    tense: ['danger', 'threat', 'hide', 'afraid', 'storm']
  }
};

// ==================================================
// (2 of 3): Trigger Definitions - what the AI is told
// ==================================================
// Each one is a stage direction, not story text. AI Dungeon reads bracketed
// lines as instructions, so they steer the scene without being narrated.

const TRIGGERS = {
  location: {
    loc1: "[Let the beam of the old lighthouse show through the fog and draw attention to it]",
    loc2: "[Mention the tide going out and the rock pools opening up below the cliff path]",
    loc3: "[Hint at the drowned chapel out on the sand flats, and the bell that still rings in it]",
    mystery: "[Surface one small unexplained detail about Sethvale without pointing anywhere in particular]"
  },

  exploration: {
    discover1: "[Reveal a way up the headland the player has not tried yet]",
    discover2: "[Make the harbour feel worth going back to; someone down there knows something]",
    discover3: "[Offer the cliff path as an option without insisting on it]",
    discover4: "[Steer the scene toward somewhere warm and dry to rest]"
  },

  relationship: {
    intimacy: "[Give Wren a quiet moment alone with the player where she admits something she has not said before]",
    special: "[Move the scene toward the lantern room at the top of the lighthouse, just the two of them]",
    sync: "[Show Wren and the player working as one without needing to say anything]"
  },

  quest: {
    collectible: "[Put a torn page from the keeper's journal somewhere the player could plausibly find it]",
    challenge: "[Set a problem that needs both the player and Wren to solve]",
    revelation: "[Reveal something true about the wreck, the keeper, or why the lamp is still lit]"
  },

  character: {
    char1: "[Introduce Halloran, the harbourmaster, who is far too calm about the wreck]",
    char2: "[Introduce Sable, who runs cargo at night and does not like being asked about it]",
    char3: "[Introduce Muirin, a child who has been up the lighthouse stairs and will happily say so]"
  },

  emotional: {
    grief: "[Let the scene sit with what was lost in the wreck; no comfort yet]",
    hope: "[Give the player a glimpse of a life in Sethvale worth staying for]",
    crisis: "[Force a choice between what Wren wants and what the village needs]"
  }
};

// ==================================================
// CONFIGURATION (defaults; players override these via the settings card)
// ==================================================

const PROGRESSION_CONFIG = {
  minTurnsBetweenTriggers: 3,
  debugMode: false,
  explorationThresholdForFirstLocation: 2,
  explorationThresholdForSecondLocation: 5,
  maxPrimaryCollectibles: 7,
  maxSecondaryCollectibles: 10,
  strategy: 'rich',
  pinSettingsCard: true
};

// ==================================================
// (3 of 3): Rich Trigger Logic - the wiring
// ==================================================
// A ladder. On every eligible turn it is walked from the top, and the FIRST
// branch whose conditions hold returns the beat that gets injected.
// Read each branch as: GIVEN this state, INJECT this beat.

function getRichTrigger(progression) {
  // The quiet moment with Wren outranks everything, but only once the bond is
  // real, and only if it has been a while since the last one.
  if (STORY_CONFIG.companionName && progression.companionIntimacy >= 5 && progression.turnsSinceLastIntimacy >= 8 && progression.companionBond >= 15 && Math.random() < 0.3) {
    return TRIGGERS.relationship.intimacy;
  }

  // The player has said they are looking for pages, so help them find one.
  // Note there is no turnsSinceLastTrigger test here. The engine only calls this
  // function once the pacing setting is satisfied, so a rung asking for MORE
  // turns than the pacing allows would be starved out by the rungs below it.
  // seekingPrimary never switches back off, so a coin flip keeps it from
  // swallowing every turn for the rest of the game.
  if (progression.seekingPrimary && progression.primaryCollected < PROGRESSION_CONFIG.maxPrimaryCollectibles && Math.random() < 0.45) {
    return TRIGGERS.quest.collectible;
  }

  // EARLY: get them to the lighthouse, then down to the tide pools.
  if (progression.storyPhase === 'early' && !progression.visitedLocations.location1 && progression.explorationLevel >= 2) {
    return TRIGGERS.location.loc1;
  }
  if (progression.visitedLocations.location1 && !progression.visitedLocations.location2 && progression.explorationLevel >= 5) {
    return TRIGGERS.location.loc2;
  }

  // MIDDLE: the village fills up with people.
  // Note these hang off explorationLevel, not storyPhase. The phase can jump
  // straight from early to late when the companion bond climbs faster than the
  // exploration count, and anything gated on 'mid' would then never fire at all.
  if (progression.explorationLevel >= 6 && !progression.metCharacters.Halloran && Math.random() < 0.5) {
    return TRIGGERS.character.char1;
  }
  if (progression.explorationLevel >= 10 && progression.metCharacters.Halloran && !progression.metCharacters.Muirin && Math.random() < 0.4) {
    return TRIGGERS.character.char3;
  }
  if (progression.explorationLevel >= 8 && !progression.visitedLocations.harbour) {
    return TRIGGERS.exploration.discover2;
  }

  // LATER: the chapel opens up once enough of the journal is in hand.
  if (!progression.visitedLocations.location3 && progression.primaryCollected >= 3) {
    return TRIGGERS.location.loc3;
  }
  if (progression.companionBond >= 14 && !progression.metCharacters.Sable && Math.random() < 0.4) {
    return TRIGGERS.character.char2;
  }
  if (progression.companionBond >= 20 && !progression.visitedLocations.specialLocation) {
    return TRIGGERS.relationship.special;
  }
  if (progression.visitedLocations.location2 && progression.explorationLevel >= 12 && Math.random() < 0.3) {
    return TRIGGERS.exploration.discover1;
  }
  if (progression.visitedLocations.specialLocation && progression.turnsSinceLastIntimacy >= 6 && Math.random() < 0.3) {
    return TRIGGERS.relationship.sync;
  }

  // ENDGAME: stop nudging toward places, start paying things off.
  if (progression.storyPhase === 'endgame' && progression.primaryCollected >= 5) {
    return TRIGGERS.quest.revelation;
  }
  if (progression.storyPhase === 'endgame') {
    return TRIGGERS.quest.challenge;
  }

  // Softer nudges, for when the direct ones have already fired.
  if (progression.visitedLocations.location1 && !progression.visitedLocations.location2 && progression.explorationLevel >= 3 && Math.random() < 0.3) {
    return TRIGGERS.exploration.discover3;
  }
  if (progression.recentMood === 'tense' && progression.explorationLevel >= 4 && Math.random() < 0.35) {
    return TRIGGERS.exploration.discover4;
  }

  // Whatever the player last typed sets the tone.
  if (progression.recentMood === 'somber') {
    return TRIGGERS.emotional.grief;
  }
  if (progression.recentMood === 'hopeful') {
    return TRIGGERS.emotional.hope;
  }
  if (progression.recentMood === 'tense') {
    return TRIGGERS.emotional.crisis;
  }

  // Nothing else applied and it has gone quiet - drop a loose thread.
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

  // AI Dungeon does not always hand us a ready-made state.memory, and a fresh
  // adventure can arrive with nothing on it at all. Create it before we read
  // through it, or the very first turn dies with "cannot read storyProgression
  // of undefined".
  if (!state.memory) state.memory = {};

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
    StoryProgression, STORY_CONFIG, TRIGGERS, PROGRESSION_CONFIG,
    // exposed for testing
    parseSettings, applySettings, findSettingsCard, ensureSettingsCard,
    getSettingsCardEntry, loadConfigFromWorldInfo, getRichTrigger,
    getSequentialTrigger, pinSettingsCard
  };
}
