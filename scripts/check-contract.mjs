import { readFileSync } from 'node:fs';

const contracts = [
  {
    name: 'KageVote',
    path: new URL('../contracts/KageVote.compact', import.meta.url),
    requirements: [
      'export ledger proposalId',
      'export ledger ballotWindowOpen',
      'export ledger totalBallots',
      'witness eligibleMember',
      'witness privateVoteChoice',
      'disclose(eligibleMember())',
      'export circuit castPrivateBallot',
    ],
  },
  {
    name: 'Veil Allowlist',
    path: new URL('../contracts/veil-allowlist.compact', import.meta.url),
    requirements: [
      'export ledger gateOpen',
      'export ledger successfulEntries',
      'witness allowlistedMember',
      'disclose(allowlistedMember())',
      'export circuit provePrivateAccess',
    ],
  },
];

for (const contract of contracts) {
  const source = readFileSync(contract.path, 'utf8');
  const missing = contract.requirements.filter((fragment) => !source.includes(fragment));
  if (missing.length) {
    console.error(`${contract.name} source check failed. Missing: ${missing.join(', ')}`);
    process.exit(1);
  }
}

console.log('Compact source checks passed for KageVote and Veil Allowlist.');
