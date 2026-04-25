import { mnemonicToStxPrivKey } from '@stacks/transactions';

// REEMPLAZA ESTO con tus 12 o 24 palabras
const mnemonic = "brown weird curve old found clog super vendor pen keep size giant";

async function derive() {
  try {
    // La derivación estándar de Stacks usa el índice 0
    const privateKey = await mnemonicToStxPrivKey(mnemonic);
    console.log("Tu PRIVATE_KEY es:");
    console.log(privateKey);
  } catch (e) {
    console.error("Error derivando la clave:", e);
  }
}

derive();
