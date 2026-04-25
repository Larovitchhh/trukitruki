import pkg from '@stacks/transactions';
const { makeContractCall, broadcastTransaction, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== ARRANQUE SINCRONIZADO CON NONCE 18 ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/5757'/0'/0/0");
    const clavePrivada = Buffer.from(child.privateKey).toString('hex');
    
    // Forzamos el inicio desde 18 porque tu última TX fue la 17
    let nonce = 18; 
    console.log(`✅ Empezando desde Nonce: ${nonce}`);

    const red = {
      version: 0x00,
      chainId: 1,
      coreApiUrl: 'https://api.mainnet.hiro.so'
    };

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
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 4000, // 0.004 STX (Ligeramente superior a tu manual de 0.003)
          network: red,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        if (result.txid) {
            console.log(`[Nonce ${nonce}] ✅ LANZADA: https://explorer.hiro.so/txid/0x${result.txid}?chain=mainnet`);
            nonce++;
        } else {
            console.log(`[Nonce ${nonce}] ⚠️ Nodo dice: ${JSON.stringify(result)}`);
            // Si el error es de Nonce, lo incrementamos
            if (JSON.stringify(result).includes("NonceAlreadyUsed") || JSON.stringify(result).includes("ConflictingNonceInMempool")) {
                nonce++;
            }
        }
        
        // Esperamos 45 segundos para no atropellar los bloques
        await new Promise(r => setTimeout(r, 45000));
      } catch (err) {
        console.log("⚠️ Error en intento:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
