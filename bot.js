import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== USANDO NODO ALTERNATIVO (CONSOLE LABS) ===");
  
  // Nodo oficial de la red (distinto al de Hiro)
  const API_URL = "https://stacks-node-api.mainnet.stacks.co";

  // Intentamos sacar el nonce de este nodo específico
  let nonce = 24; 
  try {
    const resAcc = await fetch(`${API_URL}/v2/accounts/${DIRECCION}?proof=0`);
    const accData = await resAcc.json();
    nonce = accData.nonce;
    console.log(`✅ Conectado. Nonce detectado: ${nonce}`);
  } catch (e) {
    console.log("⚠️ No se pudo obtener nonce, usando 24 por defecto.");
  }

  while (true) {
    try {
      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 8000, // 0.008 STX (aseguramos entrada)
        network: { version: 0x00, chainId: 1, coreApiUrl: API_URL },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      
      const response = await fetch(`${API_URL}/v2/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: tx.serialize()
      });

      const result = await response.text();

      if (response.ok) {
        // Quitamos las comillas del resultado para tener el TXID limpio
        const cleanTxid = result.replace(/"/g, '');
        console.log(`[Nonce ${nonce}] 🚀 PROPAGADA: https://explorer.hiro.so/txid/0x${cleanTxid}?chain=mainnet`);
        nonce++;
        // Esperamos 60 segundos
        await new Promise(r => setTimeout(r, 60000));
      } else {
        console.log(`[Nonce ${nonce}] ❌ RECHAZADA: ${result}`);
        if (result.includes("NonceAlreadyUsed")) nonce++;
        await new Promise(r => setTimeout(r, 10000));
      }
    } catch (err) {
      console.log("⚠️ Error de red, reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
