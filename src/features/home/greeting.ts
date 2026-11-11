/**
 * Home greetings are concise navigation cues, not personal or relationship copy.
 */

export function getAmbientGreeting(name?: string): { title: string; subtitle: string } {
  const hour = new Date().getHours();
  const displayName = name?.trim() || 'there';

  if (hour >= 5 && hour < 12) {
    return {
      title: `Good morning, ${displayName}.`,
      subtitle: 'Your saved moments and media are ready.',
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      title: `Good afternoon, ${displayName}.`,
      subtitle: 'Pick up where you left off in your archive.',
    };
  }
  if (hour >= 18 && hour < 22) {
    return {
      title: `Good evening, ${displayName}.`,
      subtitle: 'Review recent moments or play a soundtrack.',
    };
  }
  return {
    title: `Good evening, ${displayName}.`,
    subtitle: 'Your archive is available whenever you need it.',
  };
}
