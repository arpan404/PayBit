import { bitcoinConfig } from "../utils/constants";
import axios from "axios";
const sendBTC = async (
    senderWallet: string,
    receiverAddress: string,
    amount: number): Promise<void> => {
    const rpcUrl = bitcoinConfig.rpcUrl;
    const rpcUser = bitcoinConfig.rpcUser;
    const rpcPassword = bitcoinConfig.rpcPassword;
    const auth = { auth: { username: rpcUser, password: rpcPassword } };
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
    return txid;

}

export default sendBTC;