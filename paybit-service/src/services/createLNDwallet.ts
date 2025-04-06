import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

/**
 * Creates a Lightning Network (LND) wallet for a user
 * 
 * @param userId - The ID of the user
 * @returns Object containing wallet info or undefined if an error occurs
 */
const createLNDWallet = async (userId: string, senderAddress: string): Promise<{
    walletId: string;
    pubkey: string;
    address: string;
} | undefined> => {
    try {
        // Create a unique wallet name based on user ID
        const walletName = `ln_wallet_${userId}`;

        // LND connection parameters based on the running instance
        const lndConfig = {
            restEndpoint: 'https://127.0.0.1:8080', // REST proxy address from your LND output
            grpcEndpoint: '127.0.0.1:10009',       // gRPC address from your LND output
            network: 'regtest',                     // Network from your LND output
            tlsCertPath: path.join(process.env.HOME || '', '.lnd', 'tls.cert'),
            adminMacaroonPath: path.join(process.env.HOME || '', '.lnd', 'data', 'chain', 'bitcoin', 'regtest', 'admin.macaroon')
        };

        // Read the admin macaroon for authentication
        const adminMacaroon = fs.readFileSync(lndConfig.adminMacaroonPath).toString('hex');

        // Check if wallet already exists by listing wallets
        // Note: LND in regtest mode won't have multiple wallets by default
        // This is for future multi-wallet support if needed
        console.info(`Attempting to create LND wallet for user ${userId}`);

        // Generate a wallet password
        const walletPassword = Buffer.from(uuidv4()).toString('base64');

        // Check if wallet is initialized
        let isInitialized = false;
        try {
            // Try to get wallet info - if it works, wallet is initialized
            await axios.get(`${lndConfig.restEndpoint}/v1/getinfo`, {
                headers: {
                    'Grpc-Metadata-macaroon': adminMacaroon
                },
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false, // For development only - handle certs properly in production
                    ca: fs.readFileSync(lndConfig.tlsCertPath)
                })
            });
            isInitialized = true;
        } catch (error: any) {
            // If error code is related to wallet being locked or not existing
            if (error.response &&
                (error.response.status === 404 ||
                    error.response.data?.error?.includes('wallet not found') ||
                    error.response.data?.error?.includes('wallet locked'))) {
                isInitialized = false;
            } else {
                // Unexpected error
                throw error;
            }
        }

        if (!isInitialized) {
            // Generate a new seed for the wallet
            console.info('Generating new LND wallet seed');
            const seedResponse = await axios.post(`${lndConfig.restEndpoint}/v1/genseed`, {}, {
                headers: {
                    'Grpc-Metadata-macaroon': adminMacaroon
                },
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false, // For development only
                    ca: fs.readFileSync(lndConfig.tlsCertPath)
                })
            });

            const seed = seedResponse.data.cipher_seed_mnemonic;
            if (!seed) {
                throw new Error('Failed to generate seed for LND wallet');
            }

            // Initialize the wallet
            console.info('Initializing new LND wallet');
            await axios.post(`${lndConfig.restEndpoint}/v1/initwallet`, {
                wallet_password: Buffer.from(walletPassword).toString('base64'),
                cipher_seed_mnemonic: seed,
                aezeed_passphrase: "",
                recovery_window: 0
            }, {
                headers: {
                    'Grpc-Metadata-macaroon': adminMacaroon
                },
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false, // For development only
                    ca: fs.readFileSync(lndConfig.tlsCertPath)
                })
            });

            // Store wallet password and seed securely (this is just a placeholder - implement secure storage)
            // In production, you would store this in a secure vault/HSM
            const walletData = {
                userId,
                walletName,
                walletPassword,
                seed,
                createdAt: new Date().toISOString(),
                network: lndConfig.network
            };

            // Save wallet info to secure storage (implement this based on your security requirements)
            const walletDir = path.join(process.env.HOME || '', '.lnd', 'data', 'users');
            if (!fs.existsSync(walletDir)) {
                fs.mkdirSync(walletDir, { recursive: true });
            }

            const walletInfoPath = path.join(walletDir, `${walletName}.json`);
            fs.writeFileSync(walletInfoPath, JSON.stringify(walletData, null, 2), { encoding: 'utf8' });
            console.info(`Wallet credentials saved to ${walletInfoPath}`);
        } else {
            // Wallet exists, unlock it if needed
            try {
                // Check if wallet is already unlocked by trying to get info
                await axios.get(`${lndConfig.restEndpoint}/v1/getinfo`, {
                    headers: {
                        'Grpc-Metadata-macaroon': adminMacaroon
                    },
                    httpsAgent: new (require('https')).Agent({
                        rejectUnauthorized: false,
                        ca: fs.readFileSync(lndConfig.tlsCertPath)
                    })
                });
                console.info('LND wallet is already unlocked');
            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    // Wallet is locked, try to unlock
                    // In a real implementation, you'd retrieve the password from secure storage
                    const walletDir = path.join(process.env.HOME || '', '.lnd', 'data', 'users');
                    const walletInfoPath = path.join(walletDir, `${walletName}.json`);

                    if (fs.existsSync(walletInfoPath)) {
                        const walletData = JSON.parse(fs.readFileSync(walletInfoPath, 'utf8'));
                        console.info('Unlocking existing LND wallet');

                        await axios.post(`${lndConfig.restEndpoint}/v1/unlockwallet`, {
                            wallet_password: Buffer.from(walletData.walletPassword).toString('base64'),
                        }, {
                            headers: {
                                'Grpc-Metadata-macaroon': adminMacaroon
                            },
                            httpsAgent: new (require('https')).Agent({
                                rejectUnauthorized: false,
                                ca: fs.readFileSync(lndConfig.tlsCertPath)
                            })
                        });
                    } else {
                        throw new Error('Wallet is locked but credentials file not found');
                    }
                } else {
                    throw error;
                }
            }
        }

        // Get wallet info
        console.info('Retrieving LND wallet info');
        const infoResponse = await axios.get(`${lndConfig.restEndpoint}/v1/getinfo`, {
            headers: {
                'Grpc-Metadata-macaroon': adminMacaroon
            },
            httpsAgent: new (require('https')).Agent({
                rejectUnauthorized: false,
                ca: fs.readFileSync(lndConfig.tlsCertPath)
            })
        });

        const pubkey = infoResponse.data.identity_pubkey;

        // Generate a new on-chain address for the wallet
        console.info('Generating new Bitcoin address for LND wallet');
        const addressResponse = await axios.post(`${lndConfig.restEndpoint}/v1/newaddress`, {
            type: 'WITNESS_PUBKEY_HASH' // p2wpkh address (native segwit)
        }, {
            headers: {
                'Grpc-Metadata-macaroon': adminMacaroon
            },
            httpsAgent: new (require('https')).Agent({
                rejectUnauthorized: false,
                ca: fs.readFileSync(lndConfig.tlsCertPath)
            })
        });

        const address = addressResponse.data.address;

        console.info(`Successfully created/accessed LND wallet for user ${userId} with pubkey ${pubkey}`);

        return {
            walletId: walletName,
            pubkey,
            address
        };
    } catch (error: any) {
        console.error(`Error creating/accessing LND wallet for user ${userId}: ${error.message}`);
        if (error.response) {
            console.error(`LND API error: ${JSON.stringify(error.response.data)}`);
        }
        return undefined;
    }
};

export default createLNDWallet;