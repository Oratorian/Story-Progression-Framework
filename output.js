// ==================================================
// Output Modifier for Story Progression
// ==================================================
// Processes AI-generated text after creation
// Detects when locations are reached

const modifier = (text) => {
  // Your other output modifier scripts go here (preferred)

  // Call story progression system
  // Analyzes AI output to detect location arrivals
  text = StoryProgression("output", text).text;

  return { text };
};

modifier(text);
