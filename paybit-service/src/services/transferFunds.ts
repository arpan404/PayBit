import axios from 'axios';
import mongoose from 'mongoose';
import { bitcoinConfig } from '../utils/constants';
import User from "../db/user";
import sendBTC from './sendBTC';
import { LndWallet } from '../db/lnd';
import createLNDWallet from './createLNDwallet';
import handleLND from './handleLND';

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

    // Check if receiverId is a valid ObjectId or a UUID string
    let receiver;
    if (mongoose.Types.ObjectId.isValid(receiverId)) {
      receiver = await User.findById(receiverId);
    } else {
      receiver = await User.findOne({ uid: receiverId });
    }

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

    await sendBTC(senderWallet as any, receiverAddress, amount);

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
    }

  } catch (error: unknown) {
    console.error("Error during transfer:", error);
    throw new Error("Transfer failed");
  }
};

export default transferFunds;
