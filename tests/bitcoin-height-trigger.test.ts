import { Clarinet, Tx, Chain, Account, types } from "clarinet";

Clarinet.test({
  name: "Ensure owner can set target height",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;
    
    let setHeight = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger", "set-target-height", [types.uint(500)], owner.address),
    ]);
    
    setHeight.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Non-owner cannot set target height",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let user = accounts.get("wallet_1")!;
    
    let setHeight = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger", "set-target-height", [types.uint(500)], user.address),
    ]);
    
    setHeight.receipts[0].result.expectErr().expectUint(100); // ERR_OWNER_ONLY
  },
});

Clarinet.test({
  name: "Cannot set target height after action is triggered",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;
    
    // Set height and trigger action
    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger", "set-target-height", [types.uint(10)], owner.address),
      Tx.contractCall("bitcoin-height-trigger", "trigger-action-if-height-reached", [], owner.address),
    ]);
    
    // Try setting height again
    let newHeight = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger", "set-target-height", [types.uint(20)], owner.address),
    ]);
    
    newHeight.receipts[0].result.expectErr().expectUint(101); // ERR_ALREADY_TRIGGERED
  },
});

Clarinet.test({
  name: "Action triggers when burn-block-height is reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let owner = accounts.get("deployer")!;
    
    // Set target height to 10
    chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger", "set-target-height", [types.uint(10)], owner.address),
    ]);
    
    // Mock advancing burn-block-height
    chain.mineBlock([], 10); // Move to block height 10

    let trigger = chain.mineBlock([
      Tx.contractCall("bitcoin-height-trigger", "trigger-action-if-height-reached", [], owner.address),
    ]);
    
    trigger.receipts[0].result.expectOk().expectBool(true);
  },
});
