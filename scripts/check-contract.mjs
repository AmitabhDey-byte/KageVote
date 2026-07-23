import { readFileSync } from 'node:fs';

const contractPath = new URL('../contracts/KageVote.compact', import.meta.url);
const source = readFileSync(contractPath, 'utf8');
const requirements = [
  'export ledger proposalId',
  'export ledger ballotWindowOpen',
  'export ledger totalBallots',
  'witness eligibleMember',
  'witness privateVoteChoice',
  'disclose(eligibleMember())',
  'export circuit castPrivateBallot',
];

const missing = requirements.filter((fragment) => !source.includes(fragment));
if (missing.length) {
  console.error(`Contract source check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('KageVote Compact source check passed. Run npm run contract:compile after installing the official Compact compiler.');
