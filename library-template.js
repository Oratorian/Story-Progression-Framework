// ==================================================
// AI Dungeon Story Progression Framework
// ==================================================
// Generic template for automatic triggerword injection
// Customize the sections marked with "CUSTOMIZE THIS"

// ==================================================
// ⚙️ CUSTOMIZE THIS: Story Configuration
// ==================================================

const STORY_CONFIG = {
  // Your main companion's name (for relationship tracking)
  // Leave empty ('') if your story has no companion
  companionName: 'CompanionName',

  // Location tracking - add all your locations here
  locations: {
    // Format: locationKey: { keywords: ['name', 'alternate name'], bondBonus: points }
    location1: { keywords: ['location name', 'alternate'], bondBonus: 2 },
    location2: { keywords: ['second location'], bondBonus: 2 },
    location3: { keywords: ['third location'], bondBonus: 3 },
    specialLocation: { keywords: ['special', 'intimate place'], bondBonus: 5 },
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

// ==================================================
// ⚙️ CUSTOMIZE THIS: Trigger Definitions
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

// ==================================================
// CONFIGURATION (User-adjustable via story card)
// ==================================================

const PROGRESSION_CONFIG = {
  minTurnsBetweenTriggers: 3,
  debugMode: false,
  explorationThresholdForFirstLocation: 2,
  explorationThresholdForSecondLocation: 5,
  maxPrimaryCollectibles: 7,
  maxSecondaryCollectibles: 10,
  strategy: 'rich'  // 'sequential', 'adaptive', 'random', or 'rich'
};

// Load settings from world info if available
function loadConfigFromWorldInfo() {
  if (typeof worldInfo !== 'undefined' && worldInfo) {
    const settingsCard = worldInfo.find(card => card.keys && card.keys.toLowerCase().includes('progression settings'));

    if (settingsCard && settingsCard.entry) {
        // Remove comment lines starting with # to keep context low
        const cleanedEntry = settingsCard.entry
          .split('\n')
          .filter(line => !line.trim().startsWith('#'))
          .join('\n');

        const value = cleanedEntry.toLowerCase();

        const pacingMatch = value.match(/trigger pacing:\s*(\d+)/);
        if (pacingMatch) PROGRESSION_CONFIG.minTurnsBetweenTriggers = parseInt(pacingMatch[1]);

        if (value.includes('debug mode: enabled')) PROGRESSION_CONFIG.debugMode = true;

        const firstLocMatch = value.match(/first location after:\s*(\d+)/);
        if (firstLocMatch) PROGRESSION_CONFIG.explorationThresholdForFirstLocation = parseInt(firstLocMatch[1]);

        const secondLocMatch = value.match(/second location after:\s*(\d+)/);
        if (secondLocMatch) PROGRESSION_CONFIG.explorationThresholdForSecondLocation = parseInt(secondLocMatch[1]);

        const primaryMatch = value.match(/max primary collectibles:\s*(\d+)/);
        if (primaryMatch) PROGRESSION_CONFIG.maxPrimaryCollectibles = parseInt(primaryMatch[1]);

        const secondaryMatch = value.match(/max secondary collectibles:\s*(\d+)/);
        if (secondaryMatch) PROGRESSION_CONFIG.maxSecondaryCollectibles = parseInt(secondaryMatch[1]);

        if (value.includes('strategy: sequential')) PROGRESSION_CONFIG.strategy = 'sequential';
        if (value.includes('strategy: adaptive')) PROGRESSION_CONFIG.strategy = 'adaptive';
        if (value.includes('strategy: random')) PROGRESSION_CONFIG.strategy = 'random';
        if (value.includes('strategy: rich')) PROGRESSION_CONFIG.strategy = 'rich';
    }
  }
}

// ==================================================
// CORE SYSTEM (Don't modify unless you know what you're doing)
// ==================================================

function StoryProgression(modifierType, text, stop = null) {
  loadConfigFromWorldInfo();

  if (!state.memory.storyProgression) {
    initializeProgressionState();
  }

  const progression = state.memory.storyProgression;

  switch (modifierType) {
    case 'input':
      return handleInputModifier(text, progression);
    case 'context':
      return handleContextModifier(text, stop, progression);
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

function handleContextModifier(text, stop, progression) {
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
  for (const [key, location] of Object.entries(STORY_CONFIG.locations)) {
    if (!progression.visitedLocations[key]) {
      if (location.keywords.some(keyword => lowerText.includes(keyword))) {
        progression.visitedLocations[key] = true;
        progression.companionBond += location.bondBonus;
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
// ⚙️ CUSTOMIZE THIS: Rich Trigger Logic
// ==================================================

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
  if (progression.storyPhase === 'early') {
    if (!progression.visitedLocations.location1 && progression.explorationLevel >= 2) {
      return TRIGGERS.location.loc1;
    }
    if (progression.visitedLocations.location1 && !progression.visitedLocations.location2 && progression.explorationLevel >= 5) {
      return TRIGGERS.location.loc2;
    }
  }

  // MID GAME: Exploration and characters
  if (progression.storyPhase === 'mid') {
    if (!progression.metCharacters.Character1 && Math.random() < 0.4) {
      return TRIGGERS.character.char1;
    }
  }

  // LATE GAME: Advanced content
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
  module.exports = { StoryProgression, TRIGGERS, PROGRESSION_CONFIG };
}
