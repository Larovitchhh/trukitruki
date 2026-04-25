import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode, createPrivateKey } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION_ESPERADA = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== INTENTO 100: SINCRONIZACIÓN DE DIRECCIÓN ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/5757'/0'/0/0");
    
    // FORZAMOS LA CLAVE PRIVADA A FORMATO COMPRIMIDO (El estándar de Stacks)
    const clavePrivadaHex = Buffer.from(child.privateKey).toString('hex') + "01"; 
    
    console.log(`✅ Clave derivada para: ${DIRECCION_ESPERADA}`);

    let nonce = 24; // Siguiente a tu última TX manual exitosa

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
          senderKey: clavePrivadaHex,
          nonce: nonce,
          fee: 8000, // 0.008 STX para que no haya dudas
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
          console.log(`[Nonce ${nonce}] 🚀 ¡DENTRO! TXID: 0x${result.replace(/"/g, '')}`);
          nonce++;
          await new Promise(r => setTimeout(r, 45000));
        } else {
          console.log(`❌ Error: ${result}`);
          if (result.includes("NonceAlreadyUsed")) nonce++;
          await new Promise(r => setTimeout(r, 10000));
        }
      } catch (e) {
        console.log("Reintentando...");
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("Fallo:", err.message);
  }
}

ejecutar();
