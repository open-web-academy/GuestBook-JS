import { Worker, NEAR, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // deploy contract
  const root = worker.rootAccount;

  // some test accounts
  const alice = await root.createSubAccount("alice", {
    initialBalance: NEAR.parse("5 N").toJSON(),
  });

  const bob = await root.createSubAccount("bob", {
    initialBalance: NEAR.parse("5 N").toJSON(),
  });

  const john = await root.createSubAccount("john", {
    initialBalance: NEAR.parse("10 N").toJSON(),
  });

  const contract = await root.createSubAccount("contract", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(process.argv[2]);

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract, alice, bob, john };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});

test("John send one message and retrieve it", async (t) => {
  const { contract, john } = t.context.accounts;
  await john.call(contract, "add_message", { text: "howdy" });
  const msgs = await contract.view("get_messages");
  const expectedMessagesResult = [
    { premium: false, sender: john.accountId, text: "howdy" },
  ];
  t.deepEqual(msgs, expectedMessagesResult);
});

test("Alice send one message and retrieve it", async (t) => {
  const { contract, alice } = t.context.accounts;
  await alice.call(contract, "add_message", { text: "aloha" }, { attachedDeposit: NEAR.parse('1') });
  const msgs = await contract.view("get_messages");
  const expectedMessagesResult = [
    { premium: true, sender: alice.accountId, text: "aloha" },
  ];
  t.deepEqual(msgs, expectedMessagesResult);
});

test("Bob send one message and retrieve it", async (t) => {
  const { contract, bob } = t.context.accounts;
  await bob.call(contract, "add_message", { text: "hi" }, { attachedDeposit: NEAR.parse('10') });
  const msgs = await contract.view("get_messages");
  const expectedMessagesResult = [
    { premium: false, sender: bob.accountId, text: "hi" },
  ];
  t.deepEqual(msgs, expectedMessagesResult);
});