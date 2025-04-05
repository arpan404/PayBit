import axios from 'axios';
import { bitcoinConfig } from '../utils/constants';

export default async function createWalletAndGenerateTaprootAddressRegtest(userId: string): Promise<string | undefined> {
    try {
        const rpcUrl = bitcoinConfig.rpcUrl;
        const rpcUser = bitcoinConfig.rpcUser;
        const rpcPassword = bitcoinConfig.rpcPassword;
        const auth = { auth: { username: rpcUser, password: rpcPassword } };
        const walletName = `user_wallet_${userId}`;

        // Check which wallets are currently loaded
        const listWalletsRes = await axios.post(rpcUrl, {
            jsonrpc: "1.0",
            id: "listwallets_regtest",
            method: "listwallets",
            params: []
        }, auth);

        const loadedWallets: string[] = listWalletsRes.data.result;

        // Load or create wallet if needed
        if (!loadedWallets.includes(walletName)) {
            try {
                await axios.post(rpcUrl, {
                    jsonrpc: "1.0",
                    id: "load_wallet_regtest",
                    method: "loadwallet",
                    params: [walletName]
                }, auth);
            } catch (loadErr: any) {
                const errorCode = loadErr.response?.data?.error?.code;
                
                if (errorCode === -18 || errorCode === -3 || 
                    loadErr.response?.data?.error?.message?.includes("not found")) {
                    await axios.post(rpcUrl, {
                        jsonrpc: "1.0",
                        id: "create_wallet_regtest",
                        method: "createwallet",
                        params: [walletName]
                    }, auth);
                } else {
                    throw loadErr;
                }
            }
        }

        // Generate address from the wallet
        const walletRpcUrl = `${rpcUrl}/wallet/${walletName}`;
        
        try {
            const addressRes = await axios.post(walletRpcUrl, {
                jsonrpc: "1.0",
                id: "generate_address_bech32m_regtest",
                method: "getnewaddress",
                params: ["", "bech32m"]
            }, auth);

            if (addressRes.data.error) {
                const fallbackRes = await axios.post(walletRpcUrl, {
                    jsonrpc: "1.0",
                    id: "generate_address_fallback_regtest",
                    method: "getnewaddress",
                    params: []
                }, auth);
                
                return fallbackRes.data.result;
            }
            
            return addressRes.data.result;
        } catch(addrErr) {
            throw addrErr;
        }

    } catch (error: any) {
        console.error(`Error creating wallet or generating address: ${error.message}`);
        return undefined;
    }
}
