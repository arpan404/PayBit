import axios from "axios";
const encryptWallet = async (walletName: string, passphrase: string) => {
    const rpcUrl = 'http://localhost:8332';
    const rpcUser = 'bitcoinrpc';
    const rpcPassword = 'Password123';
    const walletRpcUrl = `${rpcUrl}/wallet/${walletName}`;
    try {
        const auth = {
            auth: {
                username: rpcUser,
                password: rpcPassword
            }
        };
        const res = await axios.post(walletRpcUrl, {
            jsonrpc: "1.0",
            id: "encrypt_wallet",
            method: "encryptwallet",
            params: [passphrase]
        }, auth);
        console.log(`Wallet encrypted: ${res.data.result}`);
    } catch (error: any) {
        console.error('Error encrypting wallet:', error.response ? error.response.data : error.message);
    }
};

export default encryptWallet;