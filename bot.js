import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

// ESTA ES LA CLAVE QUE ME PASASTE TÚ
const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log(`=== ARRANCANDO CON TU WALLET REAL: ${DIRECCION} ===`);
  
  while (true) {
    try {
      // 1. Forzamos a pedir el nonce directamente al nodo para no fallar
      const resAcc = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
      const accData = await resAcc.json();
      
      // Si la red está atascada, este nonce nos dirá la verdad
      let currentNonce = accData.nonce;

      console.log(`📡 Nodo dice que tu Nonce es: ${currentNonce}`);

      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: currentNonce,
        fee: 6000, 
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const res = await fetch('https://api.mainnet.hiro.so/v2/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: tx.serialize()
      });

      const texto = await res.text();
      
      if (res.ok) {
        console.log(`✅ [Nonce ${currentNonce}] LANZADA: ${texto}`);
        // Esperamos 2 minutos para que el nodo de Hiro no te bloquee por Chaining
        await new Promise(r => setTimeout(r, 120000));
      } else {
        console.log(`❌ Error: ${texto}`);
        // Si sale el maldito Chaining, esperamos 5 minutos para que respire
        if (texto.includes("TooMuchChaining")) {
           await new Promise(r => setTimeout(r, 300000));
        } else {
           await new Promise(r => setTimeout(r, 20000));
        }
      }

    } catch (err) {
      console.log("Fallo de conexión, reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
