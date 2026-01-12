# AI Dungeon Story Progression Framework

A customizable, intelligent progression system for AI Dungeon scenarios. Automatically guides your story through locations, character encounters, relationship development, and quest progression using direct AI instructions.
## Features

- **Adaptive Trigger System**: Automatically injects bracketed instructions based on player behavior
- **4 Progression Strategies**: Sequential, Adaptive, Random, and Rich (fully context-aware)
- **Player Behavior Tracking**: Monitors exploration, relationship moments, quest seeking, and mood
- **Story Phase Management**: Automatically transitions through early, mid, late, and endgame phases
- **Companion-Optional**: Works with or without a main companion character
- **Configurable via Story Cards**: Players can adjust pacing and settings without touching code
- **Comment Support**: Use `#` in config for notes without consuming AI context
- **Debug Mode**: Track progression metrics in real-time
- **Token Efficient**: Optimized for free-tier users with limited context

## 🚀 Quick Start vs Custom 
 - **Basic stories:** Plug & play. Just fill in `STORY_CONFIG` and `TRIGGERS` with your locations, characters, and prompt text. The default logic handles standard progression.
 - **Complex scenarios:** The framework supports deep customization. For stories with multiple endings, branching paths, resource management, or unique mechanics, customize `getRichTrigger()` with your own logic.

## Quick Start

1. Copy all script files (`library.js`, `input.js`, `context.js`, `output.js`) to your AI Dungeon scenario
2. Customize `STORY_CONFIG` and `TRIGGERS` in `library.js` with your story content
3. Create a "Progression Settings" story card at position 0 in your story-cards.json (template provided below)
4. Upload all scripts to AI Dungeon
5. That's it! The system works out of the box

## File Structure

```
scripts/
├── library.js      # Core engine (customize this)
├── input.js        # Tracks player behavior (no changes needed)
├── context.js      # Injects triggers (no changes needed)
└── output.js       # Detects story events (no changes needed)
```

## Customization Guide

### Step 1: Define Your Story Elements

Edit the `STORY_CONFIG` section in `library.js`:

```javascript
const STORY_CONFIG = {
  // Main companion name - leave empty ('') if no companion exists
  companionName: 'CompanionName',

  // Your locations (used for tracking visits)
  locations: {
    location1: { keywords: ['location1', 'alternate name'], bondBonus: 2 },
    location2: { keywords: ['location2'], bondBonus: 2 },
    // Add all your locations...
  },

  // Your characters (used for tracking encounters)
  characters: ['NPC1', 'NPC2', 'NPC3'],

  // Collectible items (used for quest progression)
  collectibles: {
    primary: {
      name: 'Quest Item',
      keywords: ['quest', 'item'],
      max: 7,
      bondBonus: 3
    },
    secondary: {
      name: 'Memory Fragment',
      keywords: ['memory', 'fragment'],
      max: 10,
      bondBonus: 2
    }
  },

  // Keywords for tracking player behavior
  behaviorKeywords: {
    exploration: ['explore', 'search', 'investigate', 'examine'],
    intimacy: ['hold', 'touch', 'close', 'together', 'embrace'],
    memory: ['remember', 'memory', 'recall', 'past']
  }
};
```

### Step 2: Define Your Triggers

Edit the `TRIGGERS` section with **bracketed instructions**:

```javascript
const TRIGGERS = {
  location: {
    loc1: "[Guide toward Location1 with descriptive hints]",
    loc2: "[Guide toward Location2 with descriptive hints]",
    mystery: "[Unveil a new mystery without forcing a path]"
  },

  exploration: {
    discover1: "[Reveal clues about DiscoveryLocation1]",
    discover2: "[Create pull toward DiscoveryLocation2]"
  },

  relationship: {
    intimacy: "[Create quiet moment between player and companion through vulnerability]",
    special: "[Guide toward intimate setting for exploring feelings]"
  },

  quest: {
    collectible: "[Reveal opportunity to find a QuestItemName]",
    challenge: "[Introduce challenge requiring cooperation and skill]"
  },

  character: {
    npc1: "[Introduce Character1 with their defining trait]",
    npc2: "[Introduce Character2 with their defining trait]"
  },

  emotional: {
    grief: "[Create somber scene exploring loss and grief]",
    hope: "[Craft hopeful moment with visions of better future]",
    crisis: "[Introduce moral dilemma testing character bonds]"
  }
};
```

**Important**: Use bracketed instructions `[Action]` format. These are injected directly into AI context and tell the AI what to!

### Step 3: Customize Trigger Logic (Optional)

The `getRichTrigger()` function determines when triggers fire. Customize the priority system:

```javascript
function getRichTrigger(progression) {
  // HIGH PRIORITY: Your most important triggers
  if (progression.companionIntimacy >= 5 && progression.turnsSinceIntimacy >= 8) {
    return TRIGGERS.relationship.bond;
  }

  // EARLY GAME: Guide players to first locations
  if (progression.storyPhase === 'early') {
    if (!progression.visited.location1 && progression.explorationLevel >= 2) {
      return TRIGGERS.location.loc1;
    }
  }

  // Add your custom logic...

  return null;
}
```

### Step 4: Create Story Card

Add this StoryCard named `Story Progression Configuration`:

 With the following entry:

```
# Lines starting with # are ignored (use for notes)
Trigger Pacing: 3
Debug Mode: Disabled
First Location After: 2 actions
Second Location After: 5 actions
Max Memory Fragments: 10
Max Core Fragments: 7
Strategy: Rich

# Edit these values to customize your adventure
# Lower pacing = faster story, higher = slower
# Strategies: Sequential, Adaptive, Random, Rich
```

**Note**: Lines starting with `#` are filtered out to save tokens!

### Step 5: You're Done!

The bracketed instructions in your triggers tell the AI exactly what to do. The system works out of the box.

## Progression Strategies

### Sequential
Guides players through locations in order. Good for linear stories.

### Adaptive
Adjusts based on player behavior (exploration vs dialogue focus). Balanced approach.

### Random
Weighted randomization with bias toward unvisited content. Unpredictable.

### Rich (Recommended)
Fully context-aware system using all tracked metrics. Best for complex stories.

## Configuration Options

Players can edit the "Progression Settings" story card:

- **Trigger Pacing**: Turns between trigger injections (3 = default, lower = faster)
- **Debug Mode**: Enabled/Disabled (shows progression metrics)
- **Location Thresholds**: Exploration actions needed before location triggers
- **Max Collectibles**: Limits for quest items
- **Strategy**: Sequential/Adaptive/Random/Rich

## Advanced Features

### State Tracking

The system automatically tracks:
- Location visits
- Character encounters
- Collectible counts
- Exploration level
- Relationship/intimacy levels
- Player mood (hopeful, tense, somber, neutral)
- Story phase (early, mid, late, endgame)

Access via `state.memory.storyProgression`

### Custom Tracking

Add custom metrics in `handleInputModifier()`:

```javascript
// Track custom keywords
if (lowerText.includes('magic') || lowerText.includes('spell')) {
  progression.magicUseCount++;
}
```

Then use in trigger logic:

```javascript
if (progression.magicUseCount >= 5) {
  return TRIGGERS.quest.magicUnlock;
}
```

## Best Practices

1. **Start Simple**: Use Sequential strategy first, then upgrade to Rich
2. **Test Debug Mode**: Enable it to see what the system is tracking
3. **Trigger Variety**: Create 15-20 unique triggers across categories
4. **Player Agency**: Keep triggers as "soft suggestions" not commands
5. **Pacing Balance**: Default pacing of 3 works for most stories
6. **Comment Generously**: Use `#` in config cards for player guidance

## Troubleshooting

**Triggers not firing?**
- Enable Debug Mode to see current state
- Check exploration thresholds aren't too high
- Verify trigger pacing isn't too slow

**Wrong triggers appearing?**
- Review `getRichTrigger()` priority logic
- Check if locations/characters are being detected in output modifier
- Verify keyword matching in input modifier

**Players confused?**
- Add clear instructions in "Progression Settings" story card
- Explain triggers in your scenario description
- Keep default settings accessible (pacing: 3, strategy: Rich)

## Credits

Created for "The Luminous Fracture" AI Dungeon scenario.
Adapted as a general framework for the community.

## License

Free to use and modify for AI Dungeon scenarios.
Attribution appreciated but not required.

## Support

For questions or issues, reference the original implementation at:

[`The Luminous Fracture`](https://play.aidungeon.link/scenario/njotSUh1-cGe/the-luminous-fracture?share=true) scenario on AI Dungeon and contact me on Discord [Mahesvara](https://discord.com/users/149232275794558976)
