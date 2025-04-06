# PayBit

**PayBit** is a modern Bitcoin wallet app designed to make cryptocurrency accessible for everyone, especially people who are familiar with tech but are tired of the technicalities of cryptocurrency. The goal of **PayBit** is to allow **instant, seamless Bitcoin transfers**, just like **PayPal** or **UPI**.

---

## Features
- **Taproot Support**: Enhanced privacy and efficiency for Bitcoin transactions.
- **Lightning Network Integration**: Instant payments with low fees.
- **User-Friendly Interface**: Designed for simplicity and ease of use.
- **Secure Transactions**: Transparent and secure Bitcoin transfers.

---

## Prerequisites

### Backend:
1. **Bitcoin Core**:
   - Install Bitcoin Core and ensure it is configured to run on `regtest` mode.
   - Enable Taproot and Lightning Network in the configuration file (`~/.bitcoin/bitcoin.conf`):
     ```
     regtest=1
     fallbackfee=0.0002
     server=1
     txindex=1
     rpcuser=your_rpc_user
     rpcpassword=your_rpc_password
     zmqpubrawblock=tcp://127.0.0.1:28332
     zmqpubrawtx=tcp://127.0.0.1:28333
     ```

2. **LND (Lightning Network Daemon)**:
   - Install and configure LND.
   - Ensure the following settings in `~/.lnd/lnd.conf`:
     ```
     [Application Options]
     alias=PayBitNode
     color=#3399FF
     restlisten=127.0.0.1:8080
     listen=127.0.0.1:9735
     rpclisten=127.0.0.1:10009

     [Bitcoin]
     bitcoin.active=1
     bitcoin.regtest=1
     bitcoin.node=bitcoind

     [Bitcoind]
     bitcoind.rpchost=127.0.0.1
     bitcoind.rpcuser=your_rpc_user
     bitcoind.rpcpass=your_rpc_password
     bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332
     bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
     ```

3. **Node.js**:
   - Install Node.js (v16 or higher).

4. **MongoDB**:
   - Install and run MongoDB for user and transaction data storage.

---

## Running the Backend

1. Clone the repository:
   ```bash
   git clone https://github.com/arpan404/paybit.git
   cd paybit
   ```

2. Install dependencies:
   ```bash
   cd paybit-service
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```

4. Ensure Bitcoin Core and LND are running before starting the backend.

---

## Frontend:

### Prerequisites:
1. **Node.js**:
   - Install Node.js (v16 or higher).

2. **Expo CLI**:
   - Install Expo CLI globally:
     ```bash
     npm install -g expo-cli
     ```

3. **React Native**:
   - Ensure you have React Native development environment set up. Follow the [React Native setup guide](https://reactnative.dev/docs/environment-setup).

---

## Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd paybit-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   expo start
   ```

4. Use the Expo Go app on your mobile device to scan the QR code and run the app.

---

## Contributing
We welcome contributions! Please fork the repository and submit a pull request with your changes.

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.