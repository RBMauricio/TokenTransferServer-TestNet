require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const algosdk = require('algosdk');

const app = express();
app.use(bodyParser.json());

const mnemonic = process.env.MNEMONIC_EMPRESA;
const sender = algosdk.mnemonicToSecretKey(mnemonic);
const algod = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

app.post('/enviar-token', async (req, res) => {
  const { wallet_algorand, tokens, asset_id } = req.body;

  if (!wallet_algorand || !tokens || !asset_id) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const params = await algod.getTransactionParams().do();

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: wallet_algorand,
      amount: parseInt(tokens),
      assetIndex: parseInt(asset_id),
      suggestedParams: params
    });

    const signedTxn = txn.signTxn(sender.sk);
    const { txId } = await algod.sendRawTransaction(signedTxn).do();

    await algosdk.waitForConfirmation(algod, txId, 4);

    res.json({ success: true, tx_id: txId });
  } catch (error) {
    console.error('❌ Error en la transferencia:', error);
    res.status(500).json({ error: 'Transferencia fallida', detalle: error.message });
  }
});

app.listen(3000, () => console.log('🚀 Servidor Replit activo en puerto 3000'));
