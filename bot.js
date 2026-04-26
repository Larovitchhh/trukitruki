import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";

async function mintear() {
  console.log("=== USANDO NODO DE XVERSE (MÁXIMA VELOCIDAD) ===");
  
  // Vamos a empezar desde el 28, que es donde se quedó el atasco
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
        fee: 10000, 
        network: { version: 0x00, chainId: 1, coreApiUrl: 'https://stacks-node-api.mainnet.stacks.co' },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      
      // Enviamos al nodo oficial de Stacks (no al de Hiro)
      const res = await fetch('https://stacks-node-api.mainnet.stacks.co/v2/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: tx.serialize()
      });

      const texto = await res.text();
      
      if (res.ok) {
        console.log(`[Nonce ${nonce}] 🚀 XVERSE OK: ${texto}`);
        nonce++;
        await new Promise(r => setTimeout(r, 60000));
      } else {
        console.log(`[Nonce ${nonce}] ❌ ERROR NODO: ${texto}`);
        
        if (texto.includes("NonceAlreadyUsed")) {
          nonce++;
        } else {
          // Si hay cola (TooMuchChaining), esperamos 2 minutos
          await new Promise(r => setTimeout(r, 120000));
        }
      }
    } catch (e) {
      console.log("Error de conexión al nodo de la Fundación...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

mintear();
