import { mnemonicToStxPrivKey } from '@stacks/transactions';

// REEMPLAZA ESTO con tus 12 o 24 palabras
const mnemonic = "tu semilla de doce palabras aqui debe ir completa y en orden";

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
