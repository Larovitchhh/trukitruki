import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

// Lista de nodos para asegurar que la TX se mueva
const NODOS = [
  "https://api.mainnet.hiro.so",
  "https://stacks-node-api.mainnet.stacks.co"
];

async function enviarANodos(txRaw, nonce) {
  for (const url of NODOS) {
    try {
      const res = await fetch(`${url}/v2/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: txRaw
      });
      const result = await res.text();
      console.log(`[Nodo: ${url}] Respuesta: ${result}`);
    } catch (e) {
      console.log(`[Nodo: ${url}] Error de conexión.`);
    }
  }
}

async function ejecutar() {
  console.log("=== ATAQUE MULTI-NODO (FUERZA BRUTA) ===");
  
  // Forzamos el Nonce 24 que es el que te toca
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
        fee: 12000, // 0.012 STX (Prioridad alta para que aparezca sí o sí)
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const txRaw = tx.serialize();

      console.log(`[Nonce ${nonce}] Propagando a todos los nodos...`);
      await enviarANodos(txRaw, nonce);

      nonce++;
      // Esperamos 2 minutos para no saturar tu propio nonce
      await new Promise(r => setTimeout(r, 120000));
      
    } catch (err) {
      console.log("Error general:", err.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
