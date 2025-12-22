// ==================================================
// Context Modifier for Story Progression
// ==================================================
// Manages the context sent to the AI model
// This is where triggerwords are injected

const modifier = (text) => {
  // Your other context modifier scripts go here (preferred)

  // Call story progression system
  // This is where triggers get injected into the context
  text = StoryProgression("context", text).text;

  return { text };
};

modifier(text);
