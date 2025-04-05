import axios from 'axios';
import encryptWallet from './encryptWallet';

/**
 * Creates a Bitcoin wallet for user and generates a Taproot address
 * @param userId Unique identifier for the user
 * @returns Taproot address as string or undefined if an error occurs
 */
export default async function createWalletAndGenerateTaprootAddress(userId: string): Promise<string | undefined> {
    try {
        // Bitcoin Core RPC connection details
        const rpcUrl = 'http://localhost:8332';
        const rpcUser = 'bitcoinrpc';
        const rpcPassword = 'Password123';

        const auth = {
            auth: {
                username: rpcUser,
                password: rpcPassword
            }
        };

        const walletName = `user_wallet_${userId}`;

        // Get list of currently loaded wallets
        const listWalletsRes = await axios.post(rpcUrl, {
            jsonrpc: "1.0",
            id: "listwallets",
            method: "listwallets",
            params: []
        }, auth);

        const loadedWallets: string[] = listWalletsRes.data.result;

        // Load existing wallet or create a new one if it doesn't exist
        if (!loadedWallets.includes(walletName)) {
            try {
                // Try to load the wallet first
                await axios.post(rpcUrl, {
                    jsonrpc: "1.0",
                    id: "load_wallet",
                    method: "loadwallet",
                    params: [walletName]
                }, auth);
                console.log(`Wallet loaded: ${walletName}`);
            } catch (loadErr: any) {
                // If wallet doesn't exist, create it
                if (loadErr.response?.data?.error?.message?.includes("not found") ||
                    loadErr.response?.data?.error?.message?.includes("Path does not exist") ||
                    loadErr.response?.data?.error?.code === -18) {
                    await axios.post(rpcUrl, {
                        jsonrpc: "1.0",
                        id: "create_wallet",
                        method: "createwallet",
                        params: [walletName]
                    }, auth);
                    console.log(`Wallet created: ${walletName}`);
                } else {
                    throw loadErr;
                }
            }
        } else {
            console.log(`Wallet already loaded: ${walletName}`);
        }

        // Generate a new Taproot address using bech32m encoding
        const walletRpcUrl = `${rpcUrl}/wallet/${walletName}`;
        const addressRes = await axios.post(walletRpcUrl, {
            jsonrpc: "1.0",
            id: "generate_address",
            method: "getnewaddress",
            params: ["", "bech32m"]
        }, auth);

        // Fallback to default address type if bech32m is not supported
        if (addressRes.data?.error) {
            console.log(`Failed with bech32m, falling back to default address type`);
            const fallbackRes = await axios.post(walletRpcUrl, {
                jsonrpc: "1.0",
                id: "generate_address",
                method: "getnewaddress",
                params: []
            }, auth);
            addressRes.data = fallbackRes.data;
        }
        await encryptWallet(walletName, userId);
        const taprootAddress = addressRes.data.result;
        return taprootAddress;
    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return undefined;
    }
}
