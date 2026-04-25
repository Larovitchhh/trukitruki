import pkg from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import fetch from 'node-fetch';

const bip32 = BIP32Factory(ecc);

async function ejecutar() {
  console.log("=== ARRANQUE MANUAL (BYPASS STACKS LIB) ===");
  
  try {
    const frase = "brown weird curve old found clog super vendor pen keep size giant";
    
    // Generamos la clave privada manualmente (Ruta de Stacks: m/44'/5757'/0'/0/0)
    const seed = await bip39.mnemonicToSeed(frase);
    const root = bip32.fromSeed(seed);
    const child = root.derivePath("m/44'/5757'/0'/0/0");
    const clavePrivada = child.privateKey.toString('hex');
    
    console.log("✅ Clave privada generada manualmente.");

    const direccion = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
    const red = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${direccion}?proof=0`);
    const data = await res.json();
    let nonce = data.nonce || 0;
    console.log("✅ Nonce:", nonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [
            pkg.stringAsciiCV("run"),
            pkg.uintCV(11),
            pkg.uintCV(67),
            pkg.uintCV(102),
            pkg.uintCV(103)
          ],
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 80000, 
          network: red,
          anchorMode: 1, 
          postConditionMode: 0x01
        };

        const tx = await pkg.makeContractCall(txOptions);
        const result = await pkg.broadcastTransaction(tx);
        
        console.log(`[Nonce ${nonce}] TXID: ${result.txid || 'Error'}`);
        
        if (result.txid || JSON.stringify(result).includes("Nonce")) {
          nonce++;
        }
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.log("Error en envío:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
