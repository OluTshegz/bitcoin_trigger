import { Clarinet, Tx, Chain, Account, types } from '@stacks/clarinet-vitest';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// Helper function to deploy the contract
const deployContract = (chain: Chain, accounts: Map<string, Account>) => {
  const deployer = accounts.get('deployer')!;
  return chain.deployContract('bitcoin-height-trigger', './contracts/bitcoin-height-trigger.clar', deployer.address);
};

// Helper function to get the contract caller
const getContractCaller = (accounts: Map<string, Account>) => {
  return accounts.get('deployer')!;
};

Clarinet.test({
  name: 'Ensure that the owner can set the target Bitcoin block height',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const targetHeight = 100000;

    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight)],
      deployer.address
    );

    assertEquals(tx.receipt.result, '(ok true)');

    const status = chain.callReadOnlyFn(
      'bitcoin-height-trigger',
      'get-status',
      [],
      deployer.address
    );
    assertEquals(status.result, `(ok { owner: '${deployer.address}', target-height: ${targetHeight}, triggered: false })`);
  },
});

Clarinet.test({
  name: 'Ensure that non-owner cannot set the target Bitcoin block height',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const nonOwner = accounts.get('wallet_1')!;
    const targetHeight = 100000;

    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight)],
      nonOwner.address
    );

    assertEquals(tx.receipt.result, '(err u100)'); // ERR_OWNER_ONLY
  },
});

Clarinet.test({
  name: 'Ensure that the target Bitcoin block height cannot be set to 0',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const targetHeight = 0;

    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight)],
      deployer.address
    );

    assertEquals(tx.receipt.result, '(err u103)'); // ERR_INVALID_HEIGHT
  },
});

Clarinet.test({
  name: 'Ensure that the action can be triggered when the target height is reached',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const targetHeight = 100000;

    // Set the target height
    await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight)],
      deployer.address
    ).receipt;

    // Simulate reaching the target height
    chain.mineBlock(targetHeight);

    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'trigger-action-if-height-reached',
      [],
      deployer.address // Can be called by anyone
    );

    assertEquals(tx.receipt.result, '(ok true)');

    const status = chain.callReadOnlyFn(
      'bitcoin-height-trigger',
      'get-status',
      [],
      deployer.address
    );
    assertEquals(status.result, `(ok { owner: '${deployer.address}', target-height: ${targetHeight}, triggered: true })`);
  },
});

Clarinet.test({
  name: 'Ensure that the action cannot be triggered before the target height is reached',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const targetHeight = 100000;
    const currentHeight = targetHeight - 1;

    // Set the target height
    await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight)],
      deployer.address
    ).receipt;

    // Simulate the current height
    chain.mineBlock(currentHeight);

    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'trigger-action-if-height-reached',
      [],
      deployer.address
    );

    assertEquals(tx.receipt.result, '(err u102)'); // ERR_HEIGHT_NOT_REACHED

    const status = chain.callReadOnlyFn(
      'bitcoin-height-trigger',
      'get-status',
      [],
      deployer.address
    );
    assertEquals(status.result, `(ok { owner: '${deployer.address}', target-height: ${targetHeight}, triggered: false })`);
  },
});

Clarinet.test({
  name: 'Ensure that the action cannot be triggered again after it has been triggered',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const targetHeight = 100000;

    // Set the target height
    await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight)],
      deployer.address
    ).receipt;

    // Simulate reaching the target height and trigger the action
    chain.mineBlock(targetHeight);
    await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'trigger-action-if-height-reached',
      [],
      deployer.address
    ).receipt;

    // Attempt to trigger the action again
    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'trigger-action-if-height-reached',
      [],
      deployer.address
    );

    assertEquals(tx.receipt.result, '(err u101)'); // ERR_ALREADY_TRIGGERED
  },
});

Clarinet.test({
  name: 'Ensure that the action cannot be triggered if the target height is not set',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const currentHeight = 100000;

    // Simulate reaching a height, but target is not set
    chain.mineBlock(currentHeight);

    const tx = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'trigger-action-if-height-reached',
      [],
      deployer.address
    );

    assertEquals(tx.receipt.result, '(err u105)'); // ERR_TARGET_NOT_SET
  },
});

Clarinet.test({
  name: 'Ensure that the owner can set the target height only once before triggering',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const targetHeight1 = 100000;
    const targetHeight2 = 100001;

    // Set the target height for the first time
    let tx1 = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight1)],
      deployer.address
    );
    assertEquals(tx1.receipt.result, '(ok true)');

    // Attempt to set the target height again
    let tx2 = await Tx.callPublicFn(
      'bitcoin-height-trigger',
      'set-target-height',
      [types.uint(targetHeight2)],
      deployer.address
    );
    assertEquals(tx2.receipt.result, '(err u101)'); // ERR_ALREADY_TRIGGERED
  },
});

Clarinet.test({
  name: 'Ensure that get-current-btc-block-height returns the current burn block height',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const contractAddress = deployContract(chain, accounts).result;
    const deployer = getContractCaller(accounts);
    const currentHeight = 100000;

    // Simulate the current height
    chain.mineBlock(currentHeight);

    const result = chain.callReadOnlyFn(
      'bitcoin-height-trigger',
      'get-current-btc-block-height',
      [],
      deployer.address
    );

    assertEquals(result.result, types.uint(currentHeight).toString());
  },
});
