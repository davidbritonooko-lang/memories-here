/**
 * PeshTok sample-comment generator.
 * Generated entries are demo content and are visibly labelled as samples in the UI.
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
      'Great framing and color ✨',
      'The lighting works beautifully.',
      'This moment feels cinematic.',
    ],
  },
  {
    author: 'Milo',
    avatarSeed: 'milo',
    messages: [
      'Excellent clip.',
      'The edit is so clean!',
      'That soundtrack fits perfectly.',
    ],
  },
  {
    author: 'Celeste',
    avatarSeed: 'celeste',
    messages: [
      'Strong visual storytelling ✨',
      'Added this to my sample favorites.',
      'The atmosphere works really well.',
    ],
  },
  {
    author: 'Nova',
    avatarSeed: 'nova',
    messages: [
      'Great visual composition.',
      'A memorable moment, well captured.',
      'Excellent soundtrack choice.',
    ],
  },
];

/**
 * Returns a randomized, explicitly simulated sample comment for a video.
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
