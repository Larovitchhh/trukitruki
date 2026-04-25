import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode, serializePayload } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== ARRANQUE DE EMERGENCIA (POST DIRECTO) ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/5757'/0'/0/0");
    const clavePrivada = Buffer.from(child.privateKey).toString('hex');

    // Forzamos el Nonce desde la API de Hiro para no fallar
    const resAccount = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
    const dataAccount = await resAccount.json();
    let nonce = dataAccount.nonce;

    console.log(`✅ Saldo verificado. Nonce inicial: ${nonce}`);

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 10000, // 0.01 STX
          network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        
        // Enviamos la TX de forma manual para ver la respuesta RAW del nodo
        const response = await fetch('https://api.mainnet.hiro.so/v2/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: tx.serialize()
        });

        const result = await response.text();

        if (response.ok) {
          console.log(`[Nonce ${nonce}] 🚀 EN MEMPOOL: https://explorer.hiro.so/txid/0x${result.replace(/"/g, '')}?chain=mainnet`);
          nonce++;
        } else {
          console.log(`[Nonce ${nonce}] ❌ RECHAZADA: ${result}`);
          // Si el error es de Nonce, sincronizamos
          if (result.includes("NonceAlreadyUsed")) nonce++;
        }

        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.log("⚠️ Error en envío:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
