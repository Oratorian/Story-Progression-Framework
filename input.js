// ==================================================
// Input Modifier for Story Progression
// ==================================================
// Processes player input before it reaches the AI
// Tracks player actions and behavior patterns

const modifier = (text) => {
  // Your other input modifier scripts go here (preferred)

  // Call story progression system
  text = StoryProgression("input", text).text;

  return { text };
};

modifier(text);
