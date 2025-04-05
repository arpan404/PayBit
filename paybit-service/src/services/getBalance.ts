import axios from 'axios';
import { bitcoinConfig } from '../utils/constants';

/**
 * Retrieves the Bitcoin balance for a user's wallet from Bitcoin Core
 * Works with both legacy addresses and Taproot addresses
 *
 * @param userId - The ID of the user
 * @returns The total balance as a number or undefined if an error occurs
 */
const getBitcoinBalance = async (userId: string): Promise<number | undefined> => {
    try {
        const walletName = `user_wallet_${userId}`;

        // 1. Check if wallet is loaded
        const listWalletsResponse = await axios.post(bitcoinConfig.rpcUrl, {
            jsonrpc: '1.0',
            id: 'paybit-getbalance',
            method: 'listwallets',
            params: []
        }, {
            auth: {
                username: bitcoinConfig.rpcUser,
                password: bitcoinConfig.rpcPassword
            }
        });

        const loadedWallets = listWalletsResponse.data.result;

        // 2. Load wallet if not already loaded
        if (!loadedWallets.includes(walletName)) {
            try {
                await axios.post(bitcoinConfig.rpcUrl, {
                    jsonrpc: '1.0',
                    id: 'paybit-loadwallet',
                    method: 'loadwallet',
                    params: [walletName]
                }, {
                    auth: {
                        username: bitcoinConfig.rpcUser,
                        password: bitcoinConfig.rpcPassword
                    }
                });
            } catch (loadError: any) {
                // Check if error is "wallet not found" (error code -18)
                if (loadError.response?.data?.error?.code === -18) {
                    console.log(`Wallet ${walletName} not found. User may not have a wallet yet.`);
                    return 0; // Return 0 balance if wallet doesn't exist
                }
                throw loadError; // Rethrow for other errors
            }
        }

        // 3. Get total wallet balance (includes both confirmed and unconfirmed funds)
        const balanceResponse = await axios.post(`${bitcoinConfig.rpcUrl}/wallet/${walletName}`, {
            jsonrpc: '1.0',
            id: 'paybit-getbalance',
            method: 'getbalance',
            params: [] // Empty params uses default settings (all confirmed and unconfirmed)
        }, {
            auth: {
                username: bitcoinConfig.rpcUser,
                password: bitcoinConfig.rpcPassword
            }
        });

        // Return the total balance
        return balanceResponse.data.result;

    } catch (error: any) {
        console.error('Error fetching Bitcoin balance:', error.message);
        if (error.response) {
            console.error('Bitcoin RPC error:', error.response.data);
        }
        return undefined;
    }
};

export default getBitcoinBalance;