import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';
import fs from 'fs';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const NONCE_FILE = './nonce_state.txt';

// Función para leer el nonce guardado
function getSavedNonce() {
    if (fs.existsSync(NONCE_FILE)) {
        return parseInt(fs.readFileSync(NONCE_FILE, 'utf8'));
    }
    return 28; // Empezamos en el 28 que es el que toca
}

async function ejecutar() {
  console.log("=== BOT BÚNKER: RESISTENTE A REINICIOS ===");
  
  let nonce = getSavedNonce();

  while (true) {
    try {
      console.log(`📡 Intentando Nonce: ${nonce}`);

      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 20000, // Subimos el fee para que la red la quiera minar rápido
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
        console.log(`✅ [Nonce ${nonce}] LANZADA CON ÉXITO.`);
        nonce++;
        fs.writeFileSync(NONCE_FILE, nonce.toString());
        console.log("⏳ Esperando 15 MINUTOS. No toques nada, deja que la red procese.");
        await new Promise(r => setTimeout(r, 900000)); // 15 minutos reales
      } else {
        console.log(`❌ Error del Nodo: ${texto}`);
        if (texto.includes("TooMuchChaining")) {
           console.log("⚠️ Cola llena. El nodo tiene la anterior pero no la suelta. Esperando 10 min...");
           await new Promise(r => setTimeout(r, 600000));
        } else if (texto.includes("NonceAlreadyUsed")) {
           nonce++;
           fs.writeFileSync(NONCE_FILE, nonce.toString());
        } else {
           await new Promise(r => setTimeout(r, 30000));
        }
      }
    } catch (e) {
      console.log("Fallo de conexión, reintentando en 30s...");
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

ejecutar();
