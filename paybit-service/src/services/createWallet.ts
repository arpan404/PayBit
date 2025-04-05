import axios from 'axios';

export default async function createWalletAndGenerateTaprootAddress(userId: string): Promise<string | undefined> {
    try {
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

        // Step 1: Check which wallets are currently loaded
        const listWalletsRes = await axios.post(rpcUrl, {
            jsonrpc: "1.0",
            id: "listwallets",
            method: "listwallets",
            params: []
        }, auth);

        const loadedWallets: string[] = listWalletsRes.data.result;

        // Step 2: If not loaded, try to load it
        if (!loadedWallets.includes(walletName)) {
            try {
                await axios.post(rpcUrl, {
                    jsonrpc: "1.0",
                    id: "load_wallet",
                    method: "loadwallet",
                    params: [walletName]
                }, auth);
                console.log(`Wallet loaded: ${walletName}`);
            } catch (loadErr: any) {
                // Check for any error that suggests the wallet doesn't exist or path is invalid
                if (loadErr.response?.data?.error?.message?.includes("not found") ||
                    loadErr.response?.data?.error?.message?.includes("Path does not exist") ||
                    loadErr.response?.data?.error?.code === -18) {
                    // If wallet doesn't exist, create it
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

        // Step 3: Generate Taproot address from the specific wallet
        const walletRpcUrl = `${rpcUrl}/wallet/${walletName}`;
        // For Bitcoin Core versions that don't directly support "taproot" as an address type
        // Use bech32m (which is the encoding for Taproot/SegWit v1)
        const addressRes = await axios.post(walletRpcUrl, {
            jsonrpc: "1.0",
            id: "generate_address",
            method: "getnewaddress",
            params: ["", "bech32m"]
        }, auth);
        
        // If bech32m also fails, fallback to default address type
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

        const taprootAddress = addressRes.data.result;
        return taprootAddress;
    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return undefined;
    }
}