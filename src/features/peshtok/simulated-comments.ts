/**
 * PeshTok Simulated Social Engagement Engine
 * Generates affectionate, tender, and supportive comments
 * customized for Her World (Specification Section 35).
 */

export interface SimulatedCommentTemplate {
  author: string;
  avatarSeed: string;
  messages: string[];
}

export const SIMULATED_COMMENT_POOL: SimulatedCommentTemplate[] = [
  {
    author: 'Aura',
    avatarSeed: 'aura',
    messages: [
      'The prettiest girl in every single room ✨',
      'The lighting was made for you honestly 🤍',
      'How are you real though? 🌸',
    ],
  },
  {
    author: 'Milo',
    avatarSeed: 'milo',
    messages: [
      'Queen of my entire universe 👑',
      'This outfit is simply iconic!',
      'That smile fixes my entire day 💕',
    ],
  },
  {
    author: 'Celeste',
    avatarSeed: 'celeste',
    messages: [
      'Pure cinematic perfection ✨',
      'Saving this to my comfort folder forever 🧸',
      'Her aura is unmatched 🕊️',
    ],
  },
  {
    author: 'Nova',
    avatarSeed: 'nova',
    messages: [
      'Always glowing, always breathtaking 💖',
      'The main character of this whole world 💫',
      'Softest vibes ever ☁️',
    ],
  },
];

/**
 * Returns a randomized simulated comment for a video.
 */
export function generateRandomSimulatedComment(): {
  author_name: string;
  content: string;
  is_simulated: boolean;
} {
  const profile = SIMULATED_COMMENT_POOL[Math.floor(Math.random() * SIMULATED_COMMENT_POOL.length)];
  const content = profile.messages[Math.floor(Math.random() * profile.messages.length)];

  return {
    author_name: profile.author,
    content,
    is_simulated: true,
  };
}
