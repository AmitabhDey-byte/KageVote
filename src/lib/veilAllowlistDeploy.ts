import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/compact-runtime';
import { fromHex, toHex } from '@midnight-ntwrk/compact-runtime';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  Binding,
  Proof,
  SignatureEnabled,
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
} from '@midnight-ntwrk/ledger-v8';
import { deployContract, findDeployedContract, type DeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  createProofProvider,
  type MidnightProviders,
  type PrivateStateExport,
  type PrivateStateId,
  type PrivateStateProvider,
  type SigningKeyExport,
  type UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import * as ManagedVeil from '../../managed/contract/index.js';
import * as ManagedKageVote from '../../managed/kage-vote/contract/index.js';

type VeilPrivateState = { readonly allowlisted: boolean };
type VeilPrivateStateId = 'veilAllowlistPrivateState';
type VeilCircuitId = 'provePrivateAccess' | 'closeGate';
type KageVotePrivateState = { readonly eligible: boolean; readonly choice: bigint };
type KageVotePrivateStateId = 'kageVotePrivateState';
type KageVoteCircuitId = 'castPrivateBallot' | 'closeBallotWindow';

const privateStateId: VeilPrivateStateId = 'veilAllowlistPrivateState';

const inMemoryPrivateStateProvider = <PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> => {
  const states = new Map<string, PS>();
  const signingKeys = new Map<string, SigningKey>();
  let contractAddress = '';

  return {
    setContractAddress(address: ContractAddress) { contractAddress = address; },
    async set(id: PSI, state: PS) { states.set(`${contractAddress}:${id}`, state); },
    async get(id: PSI) { return states.get(`${contractAddress}:${id}`) ?? null; },
    async remove(id: PSI) { states.delete(`${contractAddress}:${id}`); },
    async clear() { states.clear(); },
    async setSigningKey(address: ContractAddress, key: SigningKey) { signingKeys.set(address, key); },
    async getSigningKey(address: ContractAddress) { return signingKeys.get(address) ?? null; },
    async removeSigningKey(address: ContractAddress) { signingKeys.delete(address); },
    async clearSigningKeys() { signingKeys.clear(); },
    async exportPrivateStates() { return { states: [], version: 1 } as unknown as PrivateStateExport; },
    async importPrivateStates() { return { imported: 0 } as never; },
    async exportSigningKeys() { return { keys: [] } as unknown as SigningKeyExport; },
    async importSigningKeys() { return { imported: 0 } as never; },
  };
};

const compiledVeilAllowlist = CompiledContract.make<ManagedVeil.Contract<VeilPrivateState>>(
  'VeilAllowlist',
  ManagedVeil.Contract<VeilPrivateState>,
).pipe(
  CompiledContract.withWitnesses({
    allowlistedMember: ({ privateState }) => [privateState, privateState.allowlisted],
  }),
  CompiledContract.withCompiledFileAssets('./managed'),
);

type VeilProviders = MidnightProviders<VeilCircuitId, VeilPrivateStateId, VeilPrivateState>;
type KageVoteProviders = MidnightProviders<KageVoteCircuitId, KageVotePrivateStateId, KageVotePrivateState>;

async function createBrowserProviders<PCK extends string, PSI extends PrivateStateId, PS>(api: ConnectedAPI): Promise<MidnightProviders<PCK, PSI, PS>> {
  const [configuration, shieldedAddresses] = await Promise.all([
    api.getConfiguration(),
    api.getShieldedAddresses(),
  ]);

  setNetworkId(configuration.networkId);
  const zkConfigProvider = new FetchZkConfigProvider<PCK>(window.location.origin, fetch.bind(window));
  const proofProvider = typeof api.getProvingProvider === 'function'
    ? createProofProvider(await api.getProvingProvider(zkConfigProvider))
    : configuration.proverServerUri
      ? httpClientProofProvider(configuration.proverServerUri, zkConfigProvider)
      : (() => { throw new Error('1AM did not provide a proving service. Open 1AM settings, confirm its Preview proof service, then retry.'); })();

  return {
    privateStateProvider: inMemoryPrivateStateProvider<PSI, PS>(),
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction, _ttl?: Date): Promise<FinalizedTransaction> => {
        const balanced = await api.balanceUnsealedTransaction(toHex(tx.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(balanced.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await api.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  } as MidnightProviders<PCK, PSI, PS>;
}

export type PreviewDeployment = { contractAddress: string; transactionId: string };

/** Creates a real wallet-approved contract deployment transaction on Midnight Preview. */
export async function deployVeilAllowlistOnPreview(api: ConnectedAPI, network: string): Promise<PreviewDeployment> {
  if (network !== 'preview') throw new Error('Switch the network picker to Preview before deploying this Preview contract.');

  await api.hintUsage([
    'getConfiguration',
    'getShieldedAddresses',
    'getProvingProvider',
    'balanceUnsealedTransaction',
    'submitTransaction',
  ]);

  const providers = await createBrowserProviders<VeilCircuitId, VeilPrivateStateId, VeilPrivateState>(api);
  const deployed = await deployContract(providers, {
    compiledContract: compiledVeilAllowlist,
    privateStateId,
    initialPrivateState: { allowlisted: true },
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  const transactionId = deployed.deployTxData.public.txId;
  return { contractAddress, transactionId };
}

const kageVotePrivateStateId: KageVotePrivateStateId = 'kageVotePrivateState';
const compiledKageVote = CompiledContract.make<ManagedKageVote.Contract<KageVotePrivateState>>(
  'KageVote',
  ManagedKageVote.Contract<KageVotePrivateState>,
).pipe(
  CompiledContract.withWitnesses({
    eligibleMember: ({ privateState }) => [privateState, privateState.eligible],
    privateVoteChoice: ({ privateState }) => [privateState, privateState.choice],
  }),
  CompiledContract.withCompiledFileAssets('./managed/kage-vote'),
);

type KageVoteSession = {
  readonly api: ConnectedAPI;
  readonly contractAddress: string;
  readonly providers: KageVoteProviders;
  readonly contract: DeployedContract<ManagedKageVote.Contract<KageVotePrivateState>> | FoundContract<ManagedKageVote.Contract<KageVotePrivateState>>;
};

let activeKageVoteSession: KageVoteSession | null = null;

function requirePreview(network: string) {
  if (network !== 'preview') throw new Error('Switch the network picker to Preview before using the live KageVote contract.');
}

async function configureKageVoteSession(api: ConnectedAPI, contractAddress: string, choice: number) {
  const providers = await createBrowserProviders<KageVoteCircuitId, KageVotePrivateStateId, KageVotePrivateState>(api);
  providers.privateStateProvider.setContractAddress(contractAddress);
  await providers.privateStateProvider.set(kageVotePrivateStateId, { eligible: true, choice: BigInt(choice) });
  const contract = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: compiledKageVote,
    privateStateId: kageVotePrivateStateId,
    initialPrivateState: { eligible: true, choice: BigInt(choice) },
  });
  const session: KageVoteSession = { api, contractAddress, providers, contract };
  activeKageVoteSession = session;
  return session;
}

export async function deployKageVoteOnPreview(api: ConnectedAPI, network: string): Promise<PreviewDeployment> {
  requirePreview(network);
  await api.hintUsage(['getConfiguration', 'getShieldedAddresses', 'getProvingProvider', 'balanceUnsealedTransaction', 'submitTransaction']);
  const providers = await createBrowserProviders<KageVoteCircuitId, KageVotePrivateStateId, KageVotePrivateState>(api);
  const deployed = await deployContract(providers, {
    compiledContract: compiledKageVote,
    privateStateId: kageVotePrivateStateId,
    initialPrivateState: { eligible: true, choice: 0n },
  });
  const contractAddress = deployed.deployTxData.public.contractAddress;
  activeKageVoteSession = { api, contractAddress, providers, contract: deployed };
  return { contractAddress, transactionId: deployed.deployTxData.public.txId };
}

export async function castKageVoteBallot(api: ConnectedAPI, network: string, contractAddress: string, choice: number) {
  requirePreview(network);
  if (!Number.isInteger(choice) || choice < 0 || choice > 2) throw new Error('Choose one of the three valid ballot options before proving your vote.');
  await api.hintUsage(['getConfiguration', 'getShieldedAddresses', 'getProvingProvider', 'balanceUnsealedTransaction', 'submitTransaction']);
  const session = activeKageVoteSession?.api === api && activeKageVoteSession.contractAddress === contractAddress
    ? activeKageVoteSession
    : await configureKageVoteSession(api, contractAddress, choice);
  session.providers.privateStateProvider.setContractAddress(contractAddress);
  await session.providers.privateStateProvider.set(kageVotePrivateStateId, { eligible: true, choice: BigInt(choice) });
  const result = await session.contract.callTx.castPrivateBallot();
  return { transactionId: result.public.txId };
}
