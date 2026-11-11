/**
 * Home Ambient Greetings & Notes
 * Customized by time of day and identity.
 */

export function getAmbientGreeting(name?: string): { title: string; subtitle: string } {
  const hour = new Date().getHours();
  const displayName = name || 'Peshie';

  if (hour >= 5 && hour < 12) {
    return {
      title: `Good morning, ${displayName}.`,
      subtitle: 'The sun rises on another day that belongs completely to you.',
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      title: `Good afternoon, ${displayName}.`,
      subtitle: 'Take a soft breath. Your world is waiting for you.',
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      title: `Good evening, ${displayName}.`,
      subtitle: 'The golden hour settles over all your precious memories.',
    };
  } else {
    return {
      title: `Soft midnight, ${displayName}.`,
      subtitle: 'Quiet hours for deep thoughts and gentle soundtracks.',
    };
  }
}
