import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV
} from '@stacks/transactions';

import fetch from 'node-fetch';

const CONTRACT_ADDRESS = 'SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH';
const CONTRACT_NAME = 'onchainkms-stacks';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SENDER = process.env.SENDER;

const API = 'https://stacks-node-api.mainnet.stacks.co';

async function getNonce(address) {
  const res = await fetch(`${API}/v2/accounts/${address}?proof=0`);
  const data = await res.json();
  return data.nonce;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  let nonce = await getNonce(SENDER);
  console.log("Starting nonce:", nonce);

  while (true) {
    try {

      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'mint-activity',
        functionArgs: [
          stringAsciiCV("run"),
          uintCV(1),
          uintCV(1),
          uintCV(1),
          uintCV(1)
        ],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 2000,
        network: 'mainnet',
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const result = await broadcastTransaction(tx);

      console.log(`TX ${nonce}:`, result);

      nonce++;

      await sleep(2500);

    } catch (e) {
      console.error("Error:", e);
      await sleep(5000);
    }
  }
}

run();
