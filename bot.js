import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== BOT AUTOMÁTICO REGENERATIVO ===");
  
  while (true) {
    try {
      // 1. Preguntamos el Nonce real (incluyendo las que están en la sala de espera/mempool)
      const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${DIRECCION}/nonces`);
      const data = await res.json();
      let nonce = data.possible_next_nonce;

      console.log(`📡 Trabajando con Nonce: ${nonce}`);

      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 20000, // 0.02 STX - Prioridad
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const response = await fetch('https://api.mainnet.hiro.so/v2/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: tx.serialize()
      });

      const result = await response.text();
      console.log(`[Nonce ${nonce}] Resultado: ${result}`);

      // Esperamos 2 minutos para que la red procese y no saturemos el Nonce
      console.log("⏳ Esperando 2 min para el siguiente ciclo...");
      await new Promise(r => setTimeout(r, 120000));

    } catch (err) {
      console.log("⚠️ Error de red o reinicio, reintentando en 10s...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
