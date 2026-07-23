import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export type MidnightNetwork = 'preview' | 'preprod';

export type MidnightWalletConnection = {
  api: ConnectedAPI;
  address: string;
  apiVersion: string;
  network: MidnightNetwork;
  walletId: string;
  walletName: string;
};

export class MidnightWalletError extends Error {}

const supportedApiMajor = 4;

function supportsConnector(api: InitialAPI) {
  const [major] = api.apiVersion.split('.').map(Number);
  return major === supportedApiMajor;
}

function injectedWallets() {
  return Object.entries(window.midnight ?? {}).map(([walletId, api]) => ({ walletId, api }));
}

export function getInjectedWallets() {
  return injectedWallets().map(({ walletId, api }) => ({
    apiVersion: api.apiVersion,
    compatible: supportsConnector(api),
    name: api.name,
    walletId,
  }));
}

export async function connectMidnightWallet(network: MidnightNetwork): Promise<MidnightWalletConnection> {
  const wallets = injectedWallets();
  if (!wallets.length) {
    throw new MidnightWalletError('No Midnight wallet was detected. Install and unlock Lace, then refresh this page.');
  }

  const selected = wallets.find(({ api }) => supportsConnector(api));
  if (!selected) {
    throw new MidnightWalletError('A Midnight wallet was detected, but its DApp Connector API is incompatible. Update Lace and try again.');
  }

  const connected = await selected.api.connect(network);
  await connected.hintUsage([
    'getConfiguration',
    'getConnectionStatus',
    'getDustBalance',
    'getShieldedAddresses',
  ]);

  const [configuration, connectionStatus, shieldedAddresses] = await Promise.all([
    connected.getConfiguration(),
    connected.getConnectionStatus(),
    connected.getShieldedAddresses(),
  ]);

  if (connectionStatus.status !== 'connected' || connectionStatus.networkId !== network || configuration.networkId !== network) {
    throw new MidnightWalletError(`Wallet is not connected to Midnight ${network}. Switch networks in Lace and try again.`);
  }

  return {
    api: connected,
    address: shieldedAddresses.shieldedAddress,
    apiVersion: selected.api.apiVersion,
    network,
    walletId: selected.walletId,
    walletName: selected.api.name,
  };
}

export function shortenMidnightAddress(address: string) {
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
}
