import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";

// Lista de nodos alternativos para forzar la salida
const NODOS = [
  "https://stacks-node-api.mainnet.stacks.co",
  "https://api.mainnet.hiro.so",
  "https://stacks-node.blockstack.org"
];

async function mintear() {
  console.log("=== FORZANDO SALIDA MULTI-NODO ===");
  
  // Vamos a intentar desde la 24 por si las anteriores se perdieron de verdad
  let nonce = 24; 

  while (true) {
    try {
      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 15000, 
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const rawTx = tx.serialize();

      console.log(`[Nonce ${nonce}] Probando en todos los nodos...`);

      for (const url of NODOS) {
        try {
          const res = await fetch(`${url}/v2/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: rawTx
          });
          const resText = await res.text();
          console.log(` > Nodo ${url}: ${resText}`);
        } catch (e) {
          console.log(` > Nodo ${url}: Error de conexión`);
        }
      }

      // Si algún nodo (que no sea el de Hiro) la acepta, avanzamos
      // Si todos dan error de Nonce o Chaining, ajustamos
      nonce++;
      await new Promise(r => setTimeout(r, 45000));

    } catch (e) {
      console.log("Error:", e.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

mintear();
