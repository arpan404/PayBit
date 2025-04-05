// import axios from 'axios';
// import config from '../config';

// /**
//  * Converts BTC to satoshis (1 BTC = 100,000,000 satoshis)
//  * 
//  * @param btcAmount - Amount in BTC
//  * @returns Amount in satoshis
//  */
// export const convertBTCtoSAT = (btcAmount: number): number => {
//   // Multiply by 100 million (1e8) and round to avoid floating point issues
//   return Math.round(btcAmount * 1e8);
// };

// /**
//  * Generates a Lightning Network invoice for the specified Bitcoin amount
//  * 
//  * @param btcAmount - Amount in BTC
//  * @param memo - Optional description for the invoice
//  * @returns The invoice string (bolt11 format) or undefined if an error occurs
//  */
// const generateInvoiceForBTC = async (
//   btcAmount: number, 
//   memo: string = 'PayBit Payment'
// ): Promise<string | undefined> => {
//   try {
//     // Convert BTC to satoshis
//     const satoshiAmount = convertBTCtoSAT(btcAmount);
    
//     // Make RPC call to Bitcoin Lightning node to create invoice
//     const response = await axios.post(config.lightning.rpcUrl, {
//       jsonrpc: '1.0',
//       id: 'paybit-invoice',
//       method: 'invoice',
//       params: [
//         satoshiAmount,
//         `ref-${Date.now()}`, // A unique label for the invoice
//         memo,
//         3600 // Expiry time in seconds (1 hour)
//       ]
//     }, {
//       auth: {
//         username: config.lightning.rpcUser,
//         password: config.lightning.rpcPassword
//       }
//     });
    
//     // Extract and return the bolt11 invoice string
//     return response.data.result.bolt11;
    
//   } catch (error: any) {
//     console.error('Error generating Lightning invoice:', error.message);
//     if (error.response) {
//       console.error('Lightning RPC error:', error.response.data);
//     }
//     return undefined;
//   }
// };

// export default generateInvoiceForBTC;