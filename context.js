// ==================================================
// Context Modifier for Story Progression
// ==================================================
// Manages the context sent to the AI model
// This is where triggerwords are injected

const modifier = (text) => {
  // Your other context modifier scripts go here (preferred)

  // Call story progression system
  text = StoryProgression("context", text, stop).text;

  return { text };
};

modifier(text);
