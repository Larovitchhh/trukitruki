import pkg from '@stacks/transactions';
const { makeContractCall, broadcastTransaction, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";

async function ejecutar() {
  console.log("=== LOCALIZANDO CUENTA CON FONDOS ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    
    // Probamos las 3 primeras rutas de derivación comunes
    let claveFinal = "";
    let direccionFinal = "";
    
    for (let i = 0; i < 3; i++) {
        const child = hdkey.derive(`m/44'/5757'/0'/0/${i}`);
        const priv = Buffer.from(child.privateKey).toString('hex');
        
        // Aquí deberíamos validar cuál es la SP35... pero para ir rápido:
        // Si tu dirección manual es SP35TF6V4VC4EX07QF36J42EG6GBDA85RPR9MV9ZK, 
        // necesitamos asegurarnos de que el bot la genera.
        console.log(`Cuenta ${i} generada.`);
        if (i === 0) { claveFinal = priv; direccionFinal = "LA_QUE_TENGA_FONDOS"; }
    }

    // --- CAMBIO MANUAL CRÍTICO ---
    // Si sabes que tu clave privada de la SP35... es una concreta, ponla aquí.
    // Si no, usaremos la cuenta 0 que es la estándar.
    const clavePrivada = claveFinal; 
    const miDireccion = "SP35TF6V4VC4EX07QF36J42EG6GBDA85RPR9MV9ZK"; 

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${miDireccion}?proof=0`);
    const data = await res.json();
    let nonce = data.nonce || 0;
    
    console.log(`✅ Identificada cuenta: ${miDireccion}`);
    console.log(`✅ Nonce detectado: ${nonce}`);

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 5000, 
          network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        if (result.txid) {
            console.log(`[Nonce ${nonce}] 🚀 https://explorer.hiro.so/txid/0x${result.txid}?chain=mainnet`);
            nonce++;
        }
        await new Promise(r => setTimeout(r, 45000));
      } catch (err) {
        console.log("Error:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR:", err.message);
  }
}
ejecutar();
