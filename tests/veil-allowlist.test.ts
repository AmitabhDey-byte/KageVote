import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const contract = readFileSync(new URL('../contracts/veil-allowlist.compact', import.meta.url), 'utf8');

describe('Veil Allowlist Compact contract', () => {
  it('keeps the allowlist credential in a private witness', () => {
    expect(contract).toContain('witness allowlistedMember(): Boolean;');
    expect(contract).not.toContain('export ledger allowlistedMember');
  });

  it('discloses only the allowlist rule outcome', () => {
    expect(contract).toContain('disclose(allowlistedMember())');
    expect(contract).toContain('"Allowlist proof failed"');
  });

  it('records aggregate entries as public state', () => {
    expect(contract).toContain('export ledger successfulEntries: Counter;');
    expect(contract).toContain('successfulEntries.increment(1);');
  });
});
