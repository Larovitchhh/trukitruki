import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";

async function mintear() {
  console.log("=== EJECUCIÓN DIRECTA: MODO MACHETE ===");
  
  // Ponemos el 28 porque es el que el nodo te rechazó por "cola llena"
  let nonce = 28; 

  while (true) {
    try {
      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 10000, // 0.01 STX
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
        console.log(`[Nonce ${nonce}] ✅ OK: ${texto}`);
        nonce++;
        await new Promise(r => setTimeout(r, 60000));
      } else {
        console.log(`[Nonce ${nonce}] ❌ ERROR: ${texto}`);
        
        if (texto.includes("TooMuchChaining")) {
          console.log("Mempool llena. Reintentando el mismo nonce en 1 minuto...");
          await new Promise(r => setTimeout(r, 60000));
        } else if (texto.includes("NonceAlreadyUsed")) {
          nonce++;
        } else {
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    } catch (e) {
      console.log("Fallo de red, reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

mintear();
