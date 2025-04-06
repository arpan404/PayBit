// @ts-ignore
import * as lnService from 'ln-service';
import * as dotenv from 'dotenv';

dotenv.config();

interface LightningPaymentOptions {
    destination: string;  // Public key of the recipient node
    tokens: number;       // Amount in satoshis
    request?: string;     // Payment request/invoice (optional if destination and tokens provided)
}

export default async function handleLND(): Promise<void> {
    // Initialize LND authentication
    const { lnd } = lnService.authenticatedLndGrpc({
        cert: process.env.LND_CERT,
        macaroon: process.env.LND_MACAROON,
        socket: process.env.LND_SOCKET, // Usually something like '127.0.0.1:10009'
    });

    return Promise.resolve();
}

/**
 * Send a payment via Lightning Network
 * @param options Payment options including destination and amount
 * @returns Payment result
 */
export async function sendLightningPayment(options: LightningPaymentOptions): Promise<any> {
    const { lnd } = lnService.authenticatedLndGrpc({
        cert: process.env.LND_CERT,
        macaroon: process.env.LND_MACAROON,
        socket: process.env.LND_SOCKET,
    });

    try {
        // If a payment request is provided, use it directly
        if (options.request) {
            const paymentResult = await lnService.pay({
                lnd,
                request: options.request,
            });
            
            return paymentResult;
        }
        
        // Otherwise use the destination and tokens
        const paymentResult = await lnService.payViaRoutes({
            lnd,
            destination: options.destination,
            tokens: options.tokens,
        });
        
        return paymentResult;
    } catch (error) {
        console.error('Lightning payment failed:', error);
        throw error;
    }
}
