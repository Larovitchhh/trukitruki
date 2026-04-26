import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import fetch from 'node-fetch';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== SISTEMA ANTIBLOQUEO (EVITANDO TOO-MUCH-CHAINING) ===");
  
  while (true) {
    try {
      // 1. Miramos el Nonce que ya está confirmado en la red
      const resAcc = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
      const accData = await resAcc.json();
      const lastConfirmedNonce = accData.nonce;

      // 2. Miramos cuántas hay en la MEMPOOL (pendientes)
      const resMempool = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${DIRECCION}/mempool`);
      const mempoolData = await resMempool.json();
      const totalPending = mempoolData.total;

      console.log(`📊 Confirmadas: ${lastConfirmedNonce} | En espera: ${totalPending}`);

      // Si tenemos más de 20 en espera, NO MANDAMOS MÁS.
      if (totalPending >= 20) {
        console.log("⏳ Cola llena. Esperando 5 minutos a que se limpien...");
        await new Promise(r => setTimeout(r, 300000));
        continue;
      }

      // El nonce para la nueva TX es el confirmado + las que están en espera
      let siguienteNonce = lastConfirmedNonce + totalPending;

      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: siguienteNonce,
        fee: 15000, // Subimos a 0.015 STX para que los mineros las quieran YA
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

      const result = await res.text();
      if (res.ok) {
        console.log(`[Nonce ${siguienteNonce}] ✅ Enviada con éxito.`);
      } else {
        console.log(`❌ Error: ${result}`);
      }

      // Esperamos 1 minuto entre envíos para no saturar
      await new Promise(r => setTimeout(r, 60000));

    } catch (err) {
      console.log("Reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
