import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== FORZANDO NONCE 24 (POST-MANUAL) ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/5757'/0'/0/0");
    const clavePrivada = Buffer.from(child.privateKey).toString('hex');

    // Empezamos en 24 porque tu última TX manual fue la 23
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
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 5000, // 0.005 STX
          network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const response = await fetch(`https://api.mainnet.hiro.so/v2/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: tx.serialize()
        });

        const result = await response.text();

        if (response.ok) {
          console.log(`[Nonce ${nonce}] ✅ LANZADA: https://explorer.hiro.so/txid/0x${result.replace(/"/g, '')}?chain=mainnet`);
          nonce++;
          // Esperamos 40 segundos para que la mempool no se sature
          await new Promise(r => setTimeout(r, 40000));
        } else {
          console.log(`[Nonce ${nonce}] ❌ ERROR: ${result}`);
          // Si nos hemos pasado de listos con el nonce, lo sincronizamos
          if (result.includes("NonceAlreadyUsed")) nonce++;
          if (result.includes("NotEnoughFunds")) {
             console.log("Nodo reporta falta de fondos. Reintentando en 10s...");
             await new Promise(r => setTimeout(r, 10000));
          }
        }
      } catch (e) { 
        console.log("Error de conexión, reintentando...");
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
