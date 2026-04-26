import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";

async function ejecutar() {
  console.log("=== MODO CLON MANUAL (ÚLTIMO INTENTO) ===");
  
  // Ponemos el 28 que es el que te pedía la red
  let nonce = 28;

  while (true) {
    try {
      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        // Simplificamos los argumentos al máximo
        functionArgs: [
          stringAsciiCV("run"),
          uintCV(11),
          uintCV(67),
          uintCV(102),
          uintCV(103)
        ],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 12000, 
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const serializedTx = tx.serialize();

      // Usamos el endpoint de Hiro que es el único que te deja conectar desde Railway
      const res = await fetch('https://api.mainnet.hiro.so/v2/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: serializedTx
      });

      const responseText = await res.text();
      
      if (res.ok) {
        console.log(`[Nonce ${nonce}] ✅ LANZADA: ${responseText}`);
        nonce++;
        // Esperamos 2 minutos. Si la red está lenta, darle prisa solo genera TooMuchChaining.
        await new Promise(r => setTimeout(r, 120000));
      } else {
        console.log(`[Nonce ${nonce}] ❌ ERROR: ${responseText}`);
        
        if (responseText.includes("TooMuchChaining")) {
           console.log("Cola llena. Esperando a que el nodo procese...");
           await new Promise(r => setTimeout(r, 300000)); // 5 minutos de calma
        } else if (responseText.includes("NonceAlreadyUsed")) {
           nonce++;
        } else {
           await new Promise(r => setTimeout(r, 10000));
        }
      }
    } catch (e) {
      console.log("Fallo de conexión, reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
