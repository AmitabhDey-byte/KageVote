import { describe, expect, it } from 'vitest';
import { localGuideReply } from './guide';

describe('Kiri local privacy guide', () => {
  it('explains that a vote choice remains private', () => {
    const reply = localGuideReply('Will my vote choice stay private?');

    expect(reply.title).toContain('shadow');
    expect(reply.body).toContain('private witness');
  });

  it('explains the observer disclosure boundary', () => {
    const reply = localGuideReply('What can an observer see publicly?');

    expect(reply.body).toContain('final aggregate tally');
    expect(reply.body).toContain('cannot map a ballot');
  });

  it('explains eligibility without exposing membership data', () => {
    const reply = localGuideReply('How do you verify that I am eligible?');

    expect(reply.title).toContain('Eligibility');
    expect(reply.body).toContain('membership data does not become ledger data');
  });

  it('falls back safely for an unrelated question', () => {
    const reply = localGuideReply('Tell me something unrelated');

    expect(reply.title).toContain('privacy boundary');
  });
});
