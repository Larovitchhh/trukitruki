import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

// CLAVE SACADA DIRECTAMENTE DE TU LOG (RUTA INDEX 0)
const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== ARRANCANDO MINTEO AUTOMÁTICO (CLAVE DIRECTA) ===");
  
  // Empezamos en 24 (el siguiente a tu TX manual 0xc8be...)
  let nonce = 24; 

  while (true) {
    try {
      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [
          stringAsciiCV("run"),
          uintCV(11),
          uintCV(67),
          uintCV(102),
          uintCV(103)
        ],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 5000, // 0.005 STX
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

      if (response.ok) {
        console.log(`[Nonce ${nonce}] ✅ LANZADA: https://explorer.hiro.so/txid/0x${result.replace(/"/g, '')}?chain=mainnet`);
        nonce++;
        // Esperamos 45 segundos entre envíos
        await new Promise(r => setTimeout(r, 45000));
      } else {
        console.log(`[Nonce ${nonce}] ❌ RECHAZADA: ${result}`);
        // Si ya se usó el nonce por una manual, saltamos al siguiente
        if (result.includes("NonceAlreadyUsed")) {
          nonce++;
        } else {
          // Si es otro error, esperamos un poco y reintentamos el mismo nonce
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    } catch (err) {
      console.log("⚠️ Error de conexión, reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
