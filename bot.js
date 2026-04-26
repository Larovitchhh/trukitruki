import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";

async function ejecutar() {
  console.log("=== MODO ANTIFILTRO: RITMO LENTO (10 MIN) ===");
  
  let nonce = 28; // El que está esperando la red

  while (true) {
    try {
      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 15000, // Subimos el fee para que el nodo tenga incentivo de soltarla
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
        console.log(`[Nonce ${nonce}] ✅ LANZADA. Esperando 10 min para que la red la trague...`);
        nonce++;
        // 10 MINUTOS DE ESPERA (600.000 ms)
        await new Promise(r => setTimeout(r, 600000));
      } else {
        console.log(`[Nonce ${nonce}] ❌ Nodo bloqueado: ${texto}`);
        if (texto.includes("TooMuchChaining")) {
           console.log("⏳ La red está saturada. Reintento en 5 minutos...");
           await new Promise(r => setTimeout(r, 300000));
        } else if (texto.includes("NonceAlreadyUsed")) {
           nonce++;
        } else {
           await new Promise(r => setTimeout(r, 20000));
        }
      }
    } catch (e) {
      console.log("Fallo de conexión...");
      await new Promise(r => setTimeout(r, 20000));
    }
  }
}

ejecutar();
