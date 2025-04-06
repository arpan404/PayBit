import axios from 'axios';
import { bitcoinConfig } from '../utils/constants';
import User from "../db/user";

const transferFunds = async (
  senderId: string,
  receiverId: string,
  amount: number,
  receiverName: string,
  transactionType: "donation" | "transfer"
): Promise<void> => {
  try {
    // Get Bitcoin RPC configuration
    const rpcUrl = bitcoinConfig.rpcUrl;
    const rpcUser = bitcoinConfig.rpcUser;
    const rpcPassword = bitcoinConfig.rpcPassword;
    const auth = { auth: { username: rpcUser, password: rpcPassword } };

    // Retrieve sender and receiver from database
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    
    if (!sender || !receiver) {
      throw new Error("Sender or receiver not found");
    }
    
    const senderWallet = sender.walletAddress;
    const senderAddress = sender.tapRootAddress;
    const receiverAddress = receiver.tapRootAddress;
    
    console.log("Sender Address:", senderAddress);
    console.log("Receiver Address:", receiverAddress);
    
    if (!senderAddress || !receiverAddress) {
      throw new Error("Sender or receiver address not found");
    }
    
    // Ensure the receiver address is a Taproot address (starts with bcrt1p for regtest)
    if (!receiverAddress.startsWith("bcrt1p")) {
      throw new Error("The provided address is not a valid Taproot address");
    }

    // Create wallet-specific URL
    const walletRpcUrl = `${rpcUrl}/wallet/${senderWallet}`;
    
    // Load wallet
    try {
      await axios.post(rpcUrl, {
        jsonrpc: "1.0",
        id: "load_wallet",
        method: "loadwallet",
        params: [senderWallet]
      }, auth);
    } catch (loadErr: any) {
      // If error is not "wallet already loaded", rethrow
      if (!loadErr.response?.data?.error?.message?.includes("already loaded")) {
        throw loadErr;
      }
    }
    
    // Send transaction
    const sendResponse = await axios.post(walletRpcUrl, {
      jsonrpc: "1.0",
      id: "send_to_address",
      method: "sendtoaddress",
      params: [receiverAddress, amount]
    }, auth);
    
    if (sendResponse.data.error) {
      throw new Error(`Transaction failed: ${sendResponse.data.error.message}`);
    }
    
    const txid = sendResponse.data.result;
    console.log(`Transaction successful! Transaction ID: ${txid}`);
    
    // Handle the transaction type
    if (transactionType === "donation") {
      console.log(`Donation of ${amount} BTC successfully sent to ${receiverName}`);
    } else {
      console.log(`Transfer of ${amount} BTC successfully sent to ${receiverName}`);
    }
    
    // Optionally unload the wallet
    try {
      await axios.post(rpcUrl, {
        jsonrpc: "1.0",
        id: "unload_wallet",
        method: "unloadwallet",
        params: [senderWallet]
      }, auth);
    } catch (unloadErr) {
      console.warn("Warning: Failed to unload wallet", unloadErr);
      // Non-fatal error, no need to throw
    }
    
  } catch (error: unknown) {
    console.error("Error during transfer:", error);
    throw new Error("Transfer failed");
  }
}

export default transferFunds;
