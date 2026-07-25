import { describe, expect, it } from 'vitest';
import { getPreferredWalletId, MIDNIGHT_NETWORKS, type InjectedMidnightWallet } from '../src/lib/midnightWallet';

const lace: InjectedMidnightWallet = {
  apiVersion: '4.0.1', compatible: true, name: 'Lace', rdns: 'com.lace.wallet', walletId: 'lace',
};
const oneAm: InjectedMidnightWallet = {
  apiVersion: '4.0.1', compatible: true, name: '1AM', rdns: 'xyz.1am.wallet', walletId: 'one-am',
};

describe('1AM network configuration', () => {
  it('exposes Preview and Preprod connector network ids', () => {
    expect(MIDNIGHT_NETWORKS.preview.connectorNetworkId).toBe('preview');
    expect(MIDNIGHT_NETWORKS.preprod.connectorNetworkId).toBe('preprod');
  });

  it('prefers 1AM when both compatible wallets are available', () => {
    expect(getPreferredWalletId([lace, oneAm])).toBe('one-am');
  });

  it('keeps a compatible wallet fallback when 1AM is unavailable', () => {
    expect(getPreferredWalletId([lace])).toBe('lace');
  });
});
