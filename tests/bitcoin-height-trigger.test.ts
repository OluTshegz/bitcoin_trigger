import { Clarinet, Tx, Chain, Account, types } from "clarinet";

Clarinet.test({
  name: "Owner can set target height successfully",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;

    let setHeight = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "set-target-height", [types.uint(500)], owner.address),
    ]);

    setHeight.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Non-owner cannot set target height",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let user = accounts.get("wallet_1")!;

    let setHeight = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "set-target-height", [types.uint(500)], user.address),
    ]);

    setHeight.receipts[0].result.expectErr().expectTuple({ code: types.uint(100) }); // ERR_OWNER_ONLY
  },
});

Clarinet.test({
  name: "Owner can reset target height before triggering",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "set-target-height", [types.uint(500)], owner.address),
    ]);

    let reset = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "reset-target-height", [], owner.address),
    ]);

    reset.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Cannot reset target height after action is triggered",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "set-target-height", [types.uint(5)], owner.address),
    ]);

    // Mock advancing burn-block-height
    chain.mineBlock([], 5); // Move to block height 5

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "trigger-action-if-height-reached", [], owner.address),
    ]);

    let reset = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "reset-target-height", [], owner.address),
    ]);

    reset.receipts[0].result.expectErr().expectTuple({ code: types.uint(101) }); // ERR_ALREADY_TRIGGERED
  },
});

Clarinet.test({
  name: "Owner can withdraw funds after target height is reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "set-target-height", [types.uint(10)], owner.address),
    ]);

    // Mock advancing burn-block-height
    chain.mineBlock([], 10); // Move to block height 10

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "trigger-action-if-height-reached", [], owner.address),
    ]);

    let withdraw = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "withdraw", [types.uint(1000)], owner.address),
    ]);

    withdraw.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Non-owner cannot withdraw funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;
    let user = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "set-target-height", [types.uint(10)], owner.address),
    ]);

    // Mock advancing burn-block-height
    chain.mineBlock([], 10);

    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "trigger-action-if-height-reached", [], owner.address),
    ]);

    let withdraw = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger-v2", "withdraw", [types.uint(1000)], user.address),
    ]);

    withdraw.receipts[0].result.expectErr().expectTuple({ code: types.uint(100) }); // ERR_OWNER_ONLY
  },
});
