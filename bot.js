import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== FORZADO MANUAL: NODO XVERSE + NONCE REAL ===");
  
  // Tu última manual fue la 23. La siguiente TIENE que ser la 24.
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
        fee: 25000, // 0.025 STX - Prioridad máxima
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      
      // Enviamos a Xverse y a Hiro a la vez para que no haya escapatoria
      const endpoints = [
        "https://stacks-node-api.mainnet.stacks.co/v2/transactions",
        "https://api.mainnet.hiro.so/v2/transactions"
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: tx.serialize()
          });
          const result = await res.text();
          console.log(`[Nonce ${nonce}] Nodo ${url}: ${result}`);
        } catch (e) { }
      }

      // Si el bot dice que se ha enviado, subimos el nonce y esperamos
      nonce++;
      console.log(`➡️ Siguiente Nonce preparado: ${nonce}`);
      
      // Esperamos 60 segundos para que la red respire
      await new Promise(r => setTimeout(r, 60000));

    } catch (err) {
      console.log("Error:", err.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
