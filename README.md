# AI Dungeon Story Progression Framework

A customizable, intelligent progression system for AI Dungeon scenarios. It automatically guides your story through locations, character encounters, relationship development, and quest progression by injecting short bracketed instructions directly into the AI's context.

## Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [The Planner](#the-planner-set-it-up-without-writing-any-code) — set it up without writing any code
- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [Customization Guide](#customization-guide)
  - [The Mental Model](#the-mental-model-read-this-first) — read this first
  - [Step 1: Define Your Story Elements](#step-1-define-your-story-elements-the-what-exists)
  - [Step 2: Define Your Triggers](#step-2-define-your-triggers-the-what-the-ai-is-told)
  - [Step 3: Wire It Together (`getRichTrigger()`)](#step-3-wire-it-together-in-getrichtrigger-the-heart-of-the-framework)
  - [Step 4: Tune Settings](#step-4-tune-settings-the-card-creates-itself)
  - [Step 5: You're Done!](#step-5-youre-done)
- [Progression Strategies](#progression-strategies)
- [What Gets Tracked](#what-gets-tracked)
- [Advanced: Custom Tracking](#advanced-custom-tracking)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits) · [License](#license) · [Support](#support)

## Features

- **Adaptive Trigger System**: Injects bracketed `[instructions]` into context based on player behavior
- **4 Progression Strategies**: Sequential, Adaptive, Random, and Rich (fully context-aware)
- **Player Behavior Tracking**: Monitors exploration, intimacy, quest seeking, and mood
- **Story Phase Management**: Transitions through early, mid, late, and endgame phases automatically
- **Companion-Optional**: Works with or without a main companion character
- **Self-Configuring Story Card**: Auto-creates a "Progression Settings" card so players tune pacing and strategy without touching code
- **Comment Support**: Use `#` in the config card for notes without spending AI context on them
- **Debug Mode**: Surfaces live progression metrics as an in-game message
- **Token Efficient**: Designed to stay lightweight for free-tier context limits

## How It Works

AI Dungeon runs three script hooks on every turn. This framework plugs a single shared engine into all three:

- **Input** (`input.js`) — reads the player's action and updates behavior counters (exploration, intimacy, mood, etc.)
- **Context** (`context.js`) — decides whether to inject a trigger, and if so prepends it to the context sent to the model
- **Output** (`output.js`) — scans the AI's response to detect location arrivals, character meetings, and collected items

All shared logic lives in `library.js`, which AI Dungeon automatically prepends to the other three scripts. State persists across turns in `state.memory.storyProgression`.

## The Planner: set it up without writing any code

Everything in the customization guide below can be done in a browser instead, on a single page that
needs no install, no account and no network once it has your file:

**[Open the planner](https://oratorian.github.io/Story-Progression-Framework/web/)** — or open
`web/index.html` from a downloaded copy of this repository. Either way nothing you load leaves your
browser. Offline, drop your `library.js` onto the page (or paste it in) rather than using the two
starting-point buttons: browsers will not let a `file://` page read the files next to it.

It does the three hard parts for you:

| | |
|---|---|
| **Lays out your world in forms** | Places, people, collectibles, keyword lists and beats, with plain-English explanations of what every field actually does. |
| **Builds the ladder by clicking** | `getRichTrigger()` — the part that puts most people off — becomes an ordered list of rungs. Pick conditions from dropdowns; the page writes the JavaScript and shows you both the code and a sentence describing it. Hand-written functions it cannot take apart are kept **verbatim**, never rewritten. |
| **Writes the finished `library.js`** | Your sections 1–3 plus the engine, copied unchanged out of whichever file you loaded, so the output is never built on a stale engine. Copy or download all four files from the **Install** tab. |

And then proves it works before you paste anything into AI Dungeon:

- **Play turns** against your own script — you type the action, you type what the AI wrote back, and the
  page shows exactly what got injected and what changed.
- **Dry run** plays 80+ turns by itself with a chosen kind of player and a fixed seed, so you can see the
  pacing: when each phase arrives, which places get reached, which beats carry the story, and which never
  fire at all.
- **Checks** catches the things that fail silently — rungs pointing at places you renamed, keywords that
  swallow each other, rungs the ladder can never reach, beats missing their brackets, and a full
  120-turn play-through.

Start from **`library.js`** for a blank slate, or from
**`EXAMPLE - The Lighthouse (filled in).js`** for a complete worked story to take apart.

## Quick Start

1. Open your scenario's **Scripts** editor in AI Dungeon (Edit Scenario → Details → Scripts).
2. Paste the contents of **`library.js` into the Library** tab. This becomes your shared code.
3. Paste `input.js`, `context.js`, and `output.js` into the Input, Context, and Output tabs respectively. These need no changes.
4. Customize `STORY_CONFIG` and `TRIGGERS` at the top of the library with your own story content (see below).
5. Play a turn. The engine auto-creates a **Progression Settings** story card — edit its values to tune pacing and strategy (see [Step 4](#step-4-tune-settings-the-card-creates-itself)).

## File Structure

```
Story Progression Framework/
├── library.js    # Core engine — CUSTOMIZE THIS (paste into the Library tab)
├── input.js      # Tracks player behavior (paste into Input tab, no changes)
├── context.js    # Injects triggers (paste into Context tab, no changes)
├── output.js     # Detects story events (paste into Output tab, no changes)
├── EXAMPLE - The Lighthouse (filled in).js   # a complete worked story
└── web/
    └── index.html   # the planner and test harness (see above) — open it directly
```

## Customization Guide

### The Mental Model (read this first)

Customizing this framework is three moving parts. Once you see how they connect, every step below is obvious:

| Part | Lives in | Answers | Example |
|---|---|---|---|
| **Places / People / Things** | `STORY_CONFIG` | "What exists in my world, and how do I detect it?" | a location keyed `location1` |
| **Beats** | `TRIGGERS` | "What nudges can I send the AI?" | a beat keyed `loc1` |
| **Wiring** | `getRichTrigger()` | "Given the current state, which beat fires?" | *"if `location1` is unvisited → send beat `loc1`"* |

The important idea: **`STORY_CONFIG` and `TRIGGERS` are two separate vocabularies, and they are meant to stay separate.** A place named `location1` is *not* automatically linked to a beat named `loc1`. The link is drawn **by hand in `getRichTrigger()`** — that function is where your story's logic actually lives.

Why keep them separate? Because one place can be guided by *different* beats depending on the situation. Early in the story you might nudge the player toward the lighthouse with a gentle hint; late in the story, toward the same lighthouse with a sense of dread. Same place, different beats. `getRichTrigger()` is where you express that.

```
STORY_CONFIG.locations.location1   ──┐
   (the place — how it's detected)   │   getRichTrigger():
                                     ├──►  "if location1 unvisited, return loc1"
TRIGGERS.location.loc1             ──┘        (you write this connection)
   (the beat — what the AI is told)
```

We'll build one real example — **The Old Lighthouse** — across all three steps so you can see the wiring end to end.

> **`visitedLocations` is the gate.** The framework auto-tracks which places the player has reached in `progression.visitedLocations`. Your wiring reads that gate — *"has the player been here yet?"* — to decide whether to keep nudging them toward a place or move on. That's the engine of progression.

### Step 1: Define Your Story Elements (the "what exists")

Edit the `STORY_CONFIG` object in `library.js`. This is your world's inventory — every place, person, and item the engine should recognize.

**Key rule:** the `keywords` are matched (case-insensitive, as substrings) against the **AI's output text**. So a location counts as "visited" the moment the AI's narration mentions one of its keywords. Choose keywords the AI will actually write.

Here is the template, followed by our lighthouse filled in:

```javascript
const STORY_CONFIG = {
  // Main companion name — leave empty ('') if there is no companion
  companionName: 'CompanionName',

  // Locations (detected in AI output). Optional reward fields fire once on first arrival.
  locations: {
    location1: { keywords: ['location name', 'alternate'], bondBonus: 2 },
    location2: { keywords: ['second location'], bondBonus: 2, explorationBonus: 3 },
    location3: { keywords: ['third location'], bondBonus: 3, moodOnArrival: 'somber' },
    specialLocation: { keywords: ['special', 'intimate place'], bondBonus: 5, intimacyBonus: 2 },
    // Add more locations...
  },

  // Characters (encounters detected when the name appears in AI output)
  characters: ['Character1', 'Character2', 'Character3'],

  // Collectible items (counted toward quest progression)
  collectibles: {
    primary:   { name: 'PrimaryItem',   keywords: ['primary', 'quest item'], max: 7,  bondBonus: 3 },
    secondary: { name: 'SecondaryItem', keywords: ['secondary', 'memory'],   max: 10, bondBonus: 2 }
  },

  // Keywords that classify the player's input
  behaviorKeywords: {
    exploration: ['explore', 'search', 'investigate', 'examine', 'look around', 'venture', 'wander'],
    intimacy:    ['hold', 'touch', 'close', 'together', 'embrace', 'comfort', 'trust'],
    memory:      ['remember', 'memory', 'recall', 'familiar', 'flashback', 'past'],
    seeking:     ['find', 'search for', 'looking for', 'seeking']
  },

  // Mood detection — sets progression.recentMood, which Rich strategy reads
  moods: {
    somber:  ['sad', 'grief', 'loss', 'mourn'],
    hopeful: ['hope', 'future', 'better', 'dream'],
    tense:   ['danger', 'threat', 'attack', 'fear']
  }
};
```

**Worked example — adding The Old Lighthouse.** We give it the config key `location1` (we'll keep the default keys so the shipped wiring works — more on that in Step 3):

```javascript
locations: {
  // key       keywords the AI is likely to narrate      bond reward on arrival
  location1: { keywords: ['lighthouse', 'old lighthouse', 'beacon'], bondBonus: 3 },
  // location2, location3... your other places
}
```

Now, whenever the AI writes something like *"you climb the stairs of the **old lighthouse**"*, the engine sets `progression.visitedLocations.location1 = true` and awards the bond bonus. Remember that key — **`location1`** — we'll reference it again in Step 3.

> **What the keys mean:**
> - **`location1`** (the key) is an internal handle *you* choose. Keep it stable — your wiring in Step 3 refers to it.
> - **`keywords`** (required) are what the engine looks for in the AI's text.
> - All reward fields below are **optional** and applied **once, on first arrival** at the place.

**Location reward fields.** Mix and match these on any location:

| Field | Effect on first arrival | Example use |
|---|---|---|
| `bondBonus` | Adds to `companionBond` | Any meaningful place |
| `explorationBonus` | Adds to `explorationLevel` — pushes the story toward the next phase faster | A hub or milestone the reaching of which should "count for a lot" |
| `moodOnArrival` | Sets `recentMood` (`'somber'` \| `'hopeful'` \| `'tense'`) — Rich strategy reacts to it | A graveyard → `somber`; a summit → `hopeful` |
| `intimacyBonus` | Adds to `companionIntimacy`, clamped to 0–10 | A quiet, romantic, or bonding place |

```javascript
// A place that advances the story AND sets a somber tone on arrival:
crypt: { keywords: ['crypt', 'catacombs'], bondBonus: 2, explorationBonus: 3, moodOnArrival: 'somber' },
```

> **Guarded by design.** Every reward field is optional — omitting one is a no-op, never an error. `bondBonus` is also guarded now (a location without it adds `0` instead of corrupting `companionBond`). Each field applies only on the *first* visit, not on repeat visits.

> **Note on collectible detection:** The `secondary` collectible is defined in config, but only the `primary` collectible is currently counted in the output modifier ([`handleOutputModifier()`](library.js)). If you want `secondary` items tracked, add a matching block there.

### Step 2: Define Your Triggers (the "what the AI is told")

Edit the `TRIGGERS` object. Each value is a **bracketed instruction** that gets prepended to the AI's context verbatim when the beat fires. Think of these as stage directions to the AI, not story text.

The keys here (`loc1`, `char1`, etc.) are a **separate set of handles** from your `STORY_CONFIG` keys. You choose them freely — they only matter because Step 3's wiring returns them.

```javascript
const TRIGGERS = {
  location: {
    loc1:    "[Guide toward LocationName1 with descriptive hints]",
    loc2:    "[Guide toward LocationName2 with descriptive hints]",
    loc3:    "[Guide toward LocationName3 with descriptive hints]",
    mystery: "[Unveil a new mystery or clue without forcing a specific path]"
  },

  relationship: {
    intimacy: "[Create a quiet moment between player and companion through vulnerability]",
    special:  "[Guide toward an intimate setting for exploring feelings]",
    sync:     "[Emphasize moments where player and companion work as one]"
  },

  quest: {
    collectible: "[Reveal an opportunity to find a QuestItemName]",
    challenge:   "[Introduce a challenge requiring cooperation and skill]",
    revelation:  "[Present a revelation about the quest or world]"
  },

  character: {
    char1: "[Introduce Character1Name with their defining trait]",
    char2: "[Introduce Character2Name with their defining trait]",
    char3: "[Introduce Character3Name with their defining trait]"
  },

  emotional: {
    grief:  "[Create a somber scene exploring loss and grief]",
    hope:   "[Craft a hopeful moment with visions of a better future]",
    crisis: "[Introduce a moral dilemma testing character bonds]"
  }
};
```

**Important:** Always use the `[Action]` bracket format. AI Dungeon treats bracketed text as an out-of-character instruction rather than story prose, so it steers the narrative without appearing as literal text in the story.

**Worked example — the lighthouse's beat.** In Step 1 we defined the *place* `location1`. Here we write the *beat* that will guide the player toward it. We'll key it `loc1`:

```javascript
location: {
  loc1: "[Guide the player toward the old lighthouse on the cliffs with an intriguing hint]",
  // loc2, loc3... beats for your other places
}
```

Notice: the place is `location1`, the beat is `loc1`. **Two different names, deliberately.** They aren't connected yet — that happens in Step 3.

### Step 3: Wire It Together in `getRichTrigger()` (the heart of the framework)

> **Prefer clicking to typing?** This whole function can be built from dropdowns in
> [the planner](#the-planner-set-it-up-without-writing-any-code) — one rung at a time, with the
> generated JavaScript shown beside each one. The rest of this section explains what the planner is
> writing for you, which is worth reading either way.

This is where your story actually comes to life. `getRichTrigger()` is a **priority ladder**: on each eligible turn the engine walks it top to bottom and injects the **first** beat whose conditions are met. This function is the *only* place your places and your beats get connected — everything above was just declaring vocabulary.

Read every branch as one sentence: **"GIVEN this state, INJECT this beat."**

Here is the branch that completes our lighthouse example — it's already in the shipped code:

```javascript
// EARLY GAME: Guide to first locations
if (progression.storyPhase === 'early') {
  //  ┌── the GATE: has the player reached location1 yet? (from STORY_CONFIG)
  //  │                                    ┌── and have they explored enough?
  if (!progression.visitedLocations.location1 && progression.explorationLevel >= 2) {
    return TRIGGERS.location.loc1;   // ← the BEAT to inject (from TRIGGERS)
  }
}
```

In plain English: *"While the story is still early, if the player hasn't found the **lighthouse** (`location1`) yet but has done some exploring, nudge them toward it with beat `loc1`."* The moment the AI narrates the player arriving (Step 1's keyword match flips `visitedLocations.location1` to `true`), this branch stops firing and the ladder moves on to the next place. **That is progression.**

**The connection you must keep consistent** — three names, one chain:

| Step 1 config key | Step 2 trigger key | Step 3 wiring |
|---|---|---|
| `STORY_CONFIG.locations.location1` | `TRIGGERS.location.loc1` | `if (!visitedLocations.location1) return TRIGGERS.location.loc1` |

If you rename the config key, you must update the wiring that checks it. If you rename the trigger key, you must update what the wiring returns. The two vocabularies never sync automatically — **`getRichTrigger()` is the seam, and it's yours to maintain.**

> **The shipped defaults already line up.** Out of the box, `getRichTrigger()` references `visitedLocations.location1`, `.location2`, `.location3`, and `metCharacters.Character1` — and those exact keys exist in the default `STORY_CONFIG`. So if you fill in keywords but keep the default keys (as our lighthouse example does), everything just works. **Renaming keys is the only thing that breaks the chain** — if you do, update this function to match, or those branches silently never fire. The function now carries inline `// WIRING:` comments marking each connection point.

**Adding your own branch.** Say you added a place `caves` and a beat `caveEntrance`. You'd insert:

```javascript
// Guide toward the caves once the player has some quest items
if (progression.storyPhase === 'mid'
    && !progression.visitedLocations.caves
    && progression.primaryCollected >= 2) {
  return TRIGGERS.location.caveEntrance;
}
```

Place it in the ladder where its priority belongs — higher = checked first. Return `null` (the function already does at the end) when nothing should fire this turn.

> **Note:** `getRichTrigger()` only runs under the **Rich** strategy (the default). Under Sequential/Adaptive/Random the connection is made differently — see [Progression Strategies](#progression-strategies).

### Step 4: Tune Settings (the card creates itself)

**You don't have to make this card.** The first time the scripts run, the engine auto-creates a Story Card titled **Progression Settings** (keys: `progression settings`) with all the defaults filled in. Just open it in your story's card list and edit the values.

The auto-generated card looks like this:

```
# Lines starting with # are ignored (use them for notes)
Trigger Pacing: 3
Debug Mode: Disabled
First Location After: 2
Second Location After: 5
Max Primary Collectibles: 7
Max Secondary Collectibles: 10
Strategy: rich
Pin Settings Card Near The Top: true

# Lower pacing = faster story, higher = slower
# Strategies: Sequential, Adaptive, Random, Rich
# Debug Mode: Enabled shows live progression metrics
```

The settings it reads:

| Card line | Controls | Default |
|---|---|---|
| `Trigger Pacing: N` | Minimum turns between injected triggers | `3` |
| `Debug Mode: Enabled` / `Disabled` | Show progression metrics in-game | `Disabled` |
| `First Location After: N` | Exploration count before the **first** location trigger | `2` |
| `Second Location After: N` | Exploration count before **every location after the first** | `5` |
| `Max Primary Collectibles: N` | Cap on the primary collectible | `7` |
| `Max Secondary Collectibles: N` | Cap on the secondary collectible | `10` |
| `Strategy: ...` | `Sequential` / `Adaptive` / `Random` / `Rich` | `Rich` |
| `Pin Settings Card Near The Top: true` / `false` | Keep this card at the top of your card list | `true` |

> **Only two location thresholds exist — there is no "Third Location After".** These thresholds gate the **Sequential** strategy only, and there are exactly two: `First Location After` sets the gate for location 1, and `Second Location After` sets the gate for **every** later location (2, 3, 4, …). They're a "kick the story into gear" pacing control, not a per-location dial. Adding a line like `Third Location After: N` does nothing — it's an unrecognized label and will be silently skipped. (The default **Rich** strategy doesn't read these at all — by design. Its pacing is tuned directly in `getRichTrigger()`, which gives the author full control; see [Rich](#rich-recommended).)

> **The parser is forgiving.** Labels are matched by squashing case, spaces, and punctuation, so `Max Primary Collectibles`, `max primary collectibles`, and `Max-Primary_Collectibles` all resolve to the same setting. Boolean values accept `Enabled/Disabled`, `True/False`, `On/Off`, or `Yes/No`. Numbers may carry trailing text (`First Location After: 2 actions` reads as `2`). Lines starting with `#` are ignored. Only the labels in the table above are recognized — an unrecognized line (e.g. "Max Memory Fragments" or "Third Location After") is simply skipped, never applied.

> **Want a different card?** The engine finds the settings card by its **keys** containing `progression settings` — not by title or position. If you'd rather manage it yourself, just make sure some card's keys include that phrase; the engine will read yours instead of creating its own. To change the identity, edit `SETTINGS_CARD_KEYS` / `SETTINGS_CARD_TITLE` at the top of `library.js`.

> **About pinning.** With `Pin Settings Card Near The Top: true` (the default), the engine moves the card to the top of your card list each turn so it's easy to find. Set it to `false` and the engine leaves the card wherever you put it. (AI Dungeon has no pin API — this simply reorders the `storyCards` array. The technique is adapted from [LewdLeah's Auto-Cards](https://github.com/LewdLeah/Auto-Cards).)

### Step 5: You're Done!

The bracketed instructions do the work — once your config and triggers are filled in, the system runs on its own.

## Progression Strategies

### Sequential
Guides players through your locations in **definition order**, gated by exploration thresholds. It connects places to beats by *position*, not by name: for the *i*-th location in `STORY_CONFIG.locations`, it fires `TRIGGERS.location.loc1`, `loc2`, `loc3`… in turn (falling back to `mystery`). So under Sequential your trigger keys **must** be named `loc1`, `loc2`, `loc3`… but your location keys can be named anything. Best for linear stories.

### Adaptive
Starts from Sequential, but if the player interacts with the companion far more than they explore, it favors relationship triggers. A balanced middle ground.

### Random
Picks any trigger at random (with a short cooldown). Unpredictable — useful for variety or testing, less so for a directed narrative.

### Rich (Recommended)
Fully context-aware: weighs intimacy, quest seeking, story phase, mood, and visited locations through the `getRichTrigger()` priority ladder. Best for complex stories.

Unlike Sequential, Rich isn't driven by the settings card — **you tune it directly in `getRichTrigger()`**, and that's the point. Every threshold (exploration gates, intimacy levels, random chances, quest counts) sits right in the branch that uses it, so you shape pacing and story beats exactly where you write the logic. This gives you the most freedom for story design; the numbers in the shipped function are sensible starting values, not fixed limits — edit them freely.

## What Gets Tracked

State lives in `state.memory.storyProgression` and includes:

- Visited locations and met characters
- Primary/secondary collectible counts
- Exploration level and companion interaction count
- Companion intimacy (0–10) and bond
- Story phase — `early` → `mid` → `late` → `endgame`, derived from exploration, bond, and collectibles
- Recent mood — `hopeful`, `tense`, `somber`, or `neutral`
- Turn counters and a rolling history of the last 10 triggers

## Advanced: Custom Tracking

Add a counter in `handleInputModifier()`:

```javascript
if (lowerText.includes('magic') || lowerText.includes('spell')) {
  progression.magicUseCount = (progression.magicUseCount || 0) + 1;
}
```

Then read it in your trigger logic:

```javascript
if (progression.magicUseCount >= 5) {
  return TRIGGERS.quest.magicUnlock; // add this trigger to TRIGGERS.quest
}
```

## Best Practices

1. **Start simple** — try Sequential first, then move to Rich once your triggers feel right.
2. **Use Debug Mode** — enable it to watch exactly what the engine tracks each turn.
3. **Aim for variety** — 15–20 distinct triggers across categories keeps the story fresh.
4. **Keep triggers soft** — phrase them as nudges (`[Guide toward...]`), not hard commands, to preserve player agency.
5. **Balance pacing** — the default of `3` suits most stories.
6. **Comment generously** — `#` lines in the settings card cost zero context.

## Troubleshooting

**Triggers not firing?**
- Load your `library.js` into [the planner](#the-planner-set-it-up-without-writing-any-code) and press
  **Run all checks** — silent breakages (a rung pointing at a renamed place, a rung the ladder can never
  reach, a place whose keywords the AI would never write) are exactly what it looks for.
- Enable Debug Mode to inspect the current state.
- Check that your exploration thresholds aren't set too high.
- Confirm Trigger Pacing isn't too slow.
- If you're on the Rich strategy and renamed your location/character keys, verify `getRichTrigger()` still references keys that exist (see the Step 3 caveat).

**Wrong triggers appearing?**
- Review the priority order in `getRichTrigger()`.
- Confirm locations/characters are actually being detected in the output modifier (their keywords must appear in the AI's text).
- Check keyword matching in `STORY_CONFIG.behaviorKeywords`.

**Rungs gated on `storyPhase === 'mid'` never fire?**
- The phase can skip `mid` entirely. `updateStoryPhase()` promotes to `late` on **either**
  `explorationLevel >= 15` **or** `companionBond >= 20`, and bond climbs on its own (+1 every five turns,
  and any intimacy of 5 or more forces it to at least 15). If your places award no `explorationBonus` and
  the player is not typing your exploration words, bond reaches 20 long before exploration reaches 8, and
  the story goes straight from `early` to `late`.
- Fix it either way: gate those rungs on `explorationLevel` instead of on the phase, or give your places
  an `explorationBonus` so exploration keeps up with the bond. The planner's **Dry run** tab shows which
  turn each phase arrives on, and its checks flag a skipped `mid`.

**Settings card not appearing?**
- It's created on the first turn the scripts run — play one action, then check your story-cards list (it's pinned near the top by default).
- If you made your own settings card, make sure `progression settings` is in its **Triggers/Keys** so the engine uses yours instead of creating a second one.

**A setting isn't taking effect?**
- Only the labels in the table above are recognized; a mistyped label is skipped silently. The label text is forgiving about spacing/case/punctuation, but the *words* must match (e.g. "Max Primary Collectibles", not "Max Memory Fragments").

## Credits

Created for **"The Luminous Fracture"** AI Dungeon scenario, then generalized into a community framework.

The self-creating, auto-pinning settings card is modeled on the settings system in **[LewdLeah's Auto-Cards](https://github.com/LewdLeah/Auto-Cards)** — the tolerant `key: value` parser and the array-reordering pin technique are adapted from that project. Thanks, LewdLeah!

## License

Free to use and modify for AI Dungeon scenarios. Attribution appreciated but not required.

## Support

Reference the original implementation:
[**The Luminous Fracture**](https://play.aidungeon.link/scenario/njotSUh1-cGe/the-luminous-fracture?share=true) on AI Dungeon — or reach me on Discord: [Mahesvara](https://discord.com/users/149232275794558976).
