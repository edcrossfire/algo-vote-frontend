import React, {useState, useEffect} from "react";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";

const App = () => {

const [currentAccount, setCurrentAccount] = useState();
const [Count1, setCount1] = useState(0);
const [Count2, setCount2] = useState(0);
const [walletbalance, setwalletbalance] = useState();
const [connector, setConnector] = useState();
const [connected, setConnected] = useState(false);
const app_address = 98604965;

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
    const port = '';
    const token = {
      'X-API-Key': process.env.API_KEY
    }

    const algodClient = new algosdk.Algodv2(token, baseServer, port);

    const addC1 = async () => {
      // construct transaction
      let sender = currentAccount;
      let appArgs = [];
      appArgs.push(new Uint8Array(Buffer.from("AddC1")));
      let params = await algodClient.getTransactionParams().do();
      const txn = algosdk.makeApplicationNoOpTxn(sender, params, app_address, appArgs);
      let txId = txn.txID().toString();

      // time to sign . . . which we have to do with walletconnect api
      const txns = [txn]
      const txnsToSign = txns.map(txn => {
      const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
      return {
        txn: encodedTxn,
    };
    });
    const requestParams = [ txnsToSign ];
    const request = formatJsonRpcRequest("algo_signTxn", requestParams);
    const result = await connector.sendCustomRequest(request);
      // have to go on phone and accept the transaction
    const decodedResult = result.map(element => {
      return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
      // send and await
      await algodClient.sendRawTransaction(decodedResult).do();
      await algosdk.waitForConfirmation(algodClient, txId, 2);
      let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
      console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
      if (transactionResponse['global-state-delta'] !== undefined ) {
        console.log("Global State updated:",transactionResponse['global-state-delta']);
        await getCount();
        }
    }

const addC2 = async () => {
  // construct transaction
let sender = currentAccount;
let appArgs = [];
appArgs.push(new Uint8Array(Buffer.from("AddC2")));
let params = await algodClient.getTransactionParams().do();
const txn = algosdk.makeApplicationNoOpTxn(sender, params, app_address, appArgs);
let txId = txn.txID().toString();

// time to sign . . . which we have to do with walletconnect api
const txns = [txn]
const txnsToSign = txns.map(txn => {
const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
return {
  txn: encodedTxn,
};
});
const requestParams = [ txnsToSign ];
const request = formatJsonRpcRequest("algo_signTxn", requestParams);
const result = await connector.sendCustomRequest(request);
// have to go on phone and accept the transaction
const decodedResult = result.map(element => {
return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
});
// send and await
await algodClient.sendRawTransaction(decodedResult).do();
await algosdk.waitForConfirmation(algodClient, txId, 2);
let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
console.log("Called app-id:",transactionResponse['txn']['txn']['apid']);
if (transactionResponse['global-state-delta'] !== undefined ) {
console.log("Global State updated:",transactionResponse['global-state-delta']);
await getCount();
}
}

const checkIfWalletIsConnected = async () => {
    try {
      if (!connector.connected) {
        console.log("No connection");
        return;
      } else {
        console.log("We have connection", connector);
      }
      const { accounts }  = connector;

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        setCurrentAccount();
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const bridge = "https://bridge.walletconnect.org";
      const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
      setConnector(connector);

      if (!connector.connected) {
        await connector.createSession();
        console.log("Creating new connector session");
      }

      connector.on("connect", (error, payload) => {
        if (error) {
          throw error;
        }
        // Get provided accounts
        const { accounts } = payload.params[0];
        console.log("connector.on connect: Connected an account with address:", accounts[0]);
        setConnector(connector);
        setConnected(true);
        setCurrentAccount(accounts[0]);
      });

      connector.on("session_update", (error, payload) => {
        if (error) {
          throw error;
        }
        // Get updated accounts 
        const { accounts } = payload.params[0];
        setCurrentAccount(accounts[0]);
      });

      connector.on("disconnect", (error, payload) => {
        if (error) {
          throw error;
        }
        setCurrentAccount();
        setConnected(false);
        setConnector();
      });

      if (connector.connected) {
        const {accounts} = connector;
        const account = accounts[0];
        setCurrentAccount(account);
        setConnected(true);
      }
    } catch(error) {
      console.log("someething didn't work in creating connector", error);
    }
  }

  const disconnectWallet = async () => {
    connector.killSession();
    console.log("Killing session for wallet with address: ", currentAccount);
    setCurrentAccount();
    setConnector();
    setConnected(false);
  }

  const getCount = async () => {
    let applicationInfoResponse = await algodClient.getApplicationByID(app_address).do();
    let globalState = []
    globalState = applicationInfoResponse['params']['global-state']
    console.log("Count1: ", globalState[0]['value']['uint']);
    setCount1(globalState[0]['value']['uint']);
    console.log("Count2: ", globalState[1]['value']['uint']);
    setCount2(globalState[1]['value']['uint']);
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getCount();
        console.log('currentAccount:', currentAccount);
  }, [currentAccount])

  return (
    <div className="h-screen max-w-screen-lg mx-auto">
      <div className="flex flex-col items-center p-10 shadow-xl rounded-xl bg-slate-800">
        <h1 className="uppercase text-slate-100 font-bold font-mono text-2xl">Are we GMI?</h1>
        <p className="px-10 pt-2 pb-6 text-slate-100 text-center font-mono max-w-prose">This is a simple voting app demonstration built on the Algorand blockchain. The smart contracts were written and deployed using PyTeal and keep track of the user vote counts for each option. Try it out by connecting your Algorand wallet on Testnet to display the voting options and placing your vote. You will see the vote count increase each time you vote!</p>

        {!currentAccount && (
          <button onClick={connectWallet} className="p-4 uppercase font-semibold shadow-xl rounded-xl bg-emerald-500 text-slate-900 font-mono">Connect Wallet</button>
        )}

        {currentAccount && (
        <>
          <button onClick={disconnectWallet} className="p-4 uppercase font-semibold shadow-xl rounded-xl bg-emerald-800 text-slate-100 font-mono">Disconnect</button>
        </>
        )}
      </div>

      <div className="pt-10 border-b-2 border-slate-500 b-color w-fit px-10 mx-auto"></div>

      {currentAccount && (
          <div className="grid grid-cols-2 place-items-center p-10">
          <div className="flex flex-col space-y-3">
            <button onClick={addC1} className="p-4 uppercase font-semibold shadow-xl rounded-xl bg-emerald-500 text-slate-900 font-mono hover:shadow-sm hover:bg-emerald-600">WAGMI</button>
            <p className="font-semibold text-slate-100 font-mono">WAGMI vote is: {Count1}</p>
          </div>

          <div className="flex flex-col space-y-3">
            <button onClick={addC2} className="p-4 uppercase font-semibold shadow-xl rounded-xl bg-emerald-500 text-slate-900 font-mono hover:shadow-sm hover:bg-emerald-600">NGMI</button>
            <p className="font-semibold text-slate-100 font-mono">NGMI vote is: {Count2}</p>
          </div>
          </div>
      )}
    </div>
  )
}

export default App