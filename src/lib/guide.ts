export type GuideReply = {
  title: string;
  body: string;
  action?: string;
};

const replies: Array<{ matches: string[]; reply: GuideReply }> = [
  {
    matches: ['private', 'secret', 'hidden', 'choice', 'vote'],
    reply: {
      title: 'Your choice stays in the shadow.',
      body: 'KageVote treats your ballot choice as a private witness. The app proves that the voting rules were met, without publishing which option you selected.',
      action: 'Open the privacy model',
    },
  },
  {
    matches: ['public', 'observer', 'see', 'visible', 'tally'],
    reply: {
      title: 'The tally is the public signal.',
      body: 'Observers can see proposal metadata, the voting window, proof-validity signals, and the final aggregate tally. They cannot map a ballot to a person or wallet.',
      action: 'See the disclosure map',
    },
  },
  {
    matches: ['eligib', 'member', 'allowed', 'proof', 'verify'],
    reply: {
      title: 'Eligibility is proven, not broadcast.',
      body: 'A local private witness checks eligibility during proof generation. The network only accepts a proof that the rule held—your underlying membership data does not become ledger data.',
      action: 'Review proof steps',
    },
  },
  {
    matches: ['wallet', 'connect', 'preprod', 'network'],
    reply: {
      title: 'Connect Lace on the selected network.',
      body: 'KageVote can connect a compatible Midnight wallet extension on Preview or Preprod and confirm its shielded address. A real ballot stays locked until a deployed contract address and generated ZK artifacts are configured.',
      action: 'Open the launchpad',
    },
  },
];

export function localGuideReply(input: string): GuideReply {
  const normalized = input.toLowerCase();
  const match = replies.find((entry) => entry.matches.some((word) => normalized.includes(word)));

  return (
    match?.reply ?? {
      title: 'Ask me about the privacy boundary.',
      body: 'I can explain what becomes public, what stays local, how eligibility proofs work, or how to move this demo to Midnight Preprod.',
      action: 'Browse the privacy model',
    }
  );
}

export const starterQuestions = [
  'What stays private?',
  'What can an observer see?',
  'How is eligibility proven?',
];
