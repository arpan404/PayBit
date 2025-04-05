import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// BLE Service and Characteristic UUIDs
export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Check if we're on a simulator/emulator
const isEmulator = Platform.OS === 'ios'
    ? !!/^(iPhone|iPad|iPod)Simulator/.test(Platform.constants.systemName || '')
    : Platform.OS === 'android' && !!(
        (Platform.constants as any)?.model?.toLowerCase().includes('emulator') ||
        (Platform.constants as any)?.model?.toLowerCase().includes('sdk') ||
        (Platform.constants as any)?.brand?.toLowerCase().includes('studio')
    );

// Force simulation mode if we're on emulator/simulator
const forceSimulation = isExpoGo || isEmulator;

// Mock Device implementation for simulation mode
class MockDevice implements Partial<Device> {
    id: string;
    name: string | null;

    constructor(id: string, name: string | null) {
        this.id = id;
        this.name = name;
    }

    connect(): Promise<Device> {
        return Promise.resolve(this as unknown as Device);
    }

    discoverAllServicesAndCharacteristics(): Promise<Device> {
        return Promise.resolve(this as unknown as Device);
    }

    services(): Promise<any[]> {
        return Promise.resolve([{ uuid: SERVICE_UUID }]);
    }

    cancelConnection(): Promise<Device> {
        return Promise.resolve(this as unknown as Device);
    }

    onDisconnected(listener: (error: any | null, device: Device) => void) {
        // Return a mock subscription that does nothing
        return {
            remove: () => { }
        };
    }
}

class BluetoothService {
    private manager: BleManager | null = null;
    private devices: Map<string, Device> = new Map();
    private mockDevices: Map<string, MockDevice> = new Map();
    private isScanning: boolean = false;
    private onDeviceDiscoveredCallback: ((device: Device) => void) | null = null;
    private onConnectionStatusChangeCallback: ((connected: boolean, device: Device | null) => void) | null = null;
    private onBluetoothStateChangeCallback: ((state: string) => void) | null = null;
    private connectedDevice: Device | null = null;
    private mockReceiverInfo: string | null = null;
    private simulationTimeout: NodeJS.Timeout | null = null;
    private isSimulationMode: boolean = false;

    constructor() {
        this.isSimulationMode = forceSimulation;

        if (!this.isSimulationMode) {
            try {
                this.manager = new BleManager();
                this.setupBleManager();
                console.log('Using real Bluetooth implementation');
            } catch (error) {
                console.warn('Error initializing BleManager:', error);
                console.warn('Falling back to simulation mode');
                this.manager = null;
                this.isSimulationMode = true;
            }
        } else {
            console.log('Using simulated Bluetooth implementation');
            this.manager = null;
        }
    }

    // Check if we're in simulation mode
    isInSimulationMode = (): boolean => {
        return this.isSimulationMode;
    }

    private setupBleManager = () => {
        if (!this.manager) return;

        try {
            // Subscribe to state changes
            const subscription = this.manager.onStateChange((state) => {
                let stateMessage = '';

                switch (state) {
                    case State.PoweredOn:
                        stateMessage = 'Bluetooth is powered on';
                        break;
                    case State.PoweredOff:
                        stateMessage = 'Bluetooth is powered off';
                        this.stopScan();
                        if (this.connectedDevice) {
                            this.disconnect();
                        }
                        break;
                    case State.Resetting:
                        stateMessage = 'Bluetooth is resetting';
                        break;
                    case State.Unsupported:
                        stateMessage = 'Bluetooth is not supported';
                        this.isSimulationMode = true;
                        break;
                    case State.Unauthorized:
                        stateMessage = 'Bluetooth permission denied';
                        break;
                    default:
                        stateMessage = `Bluetooth state: ${state}`;
                }

                console.log(stateMessage);

                if (this.onBluetoothStateChangeCallback) {
                    this.onBluetoothStateChangeCallback(stateMessage);
                }

                if (state === State.PoweredOn) {
                    // Only remove subscription when we detect powered on
                    subscription.remove();
                }
            }, true);
        } catch (error) {
            console.error('Error setting up BLE manager:', error);
            this.isSimulationMode = true;
        }
    };

    // Create simulated nearby devices
    private createSimulatedDevices() {
        try {
            const mockDevice1 = new MockDevice('device1', 'PayBit User 1');
            const mockDevice2 = new MockDevice('device2', 'iPhone 12');
            const mockDevice3 = new MockDevice('device3', 'PayBit User 2');

            this.mockDevices.set(mockDevice1.id, mockDevice1);
            this.mockDevices.set(mockDevice2.id, mockDevice2);
            this.mockDevices.set(mockDevice3.id, mockDevice3);

            return [mockDevice1, mockDevice2, mockDevice3];
        } catch (error) {
            console.error('Error creating mock devices:', error);
            return [];
        }
    }

    // Start scanning for BLE devices
    startScan = () => {
        if (this.isScanning) return;
        this.isScanning = true;
        this.devices.clear();

        try {
            if (this.manager && !this.isSimulationMode) {
                // Real Bluetooth scanning
                this.manager.startDeviceScan(null, null, (error, device) => {
                    if (error) {
                        console.error('Scanning error:', error);
                        // If we get an error during scanning, fallback to simulation mode
                        if (!this.isSimulationMode) {
                            console.warn('Falling back to simulation mode due to scan error');
                            this.isSimulationMode = true;
                            this.stopScan();
                            this.startScan(); // Restart scan in simulation mode
                        } else {
                            this.stopScan();
                        }
                        return;
                    }

                    if (device && !this.devices.has(device.id)) {
                        this.devices.set(device.id, device);

                        if (this.onDeviceDiscoveredCallback) {
                            this.onDeviceDiscoveredCallback(device);
                        }
                    }
                });
            } else {
                // Simulated Bluetooth scanning
                const mockDevices = this.createSimulatedDevices();

                // Simulate finding devices one by one with delays
                mockDevices.forEach((device, index) => {
                    const timeout = setTimeout(() => {
                        if (this.isScanning && this.onDeviceDiscoveredCallback) {
                            this.onDeviceDiscoveredCallback(device as unknown as Device);
                        }
                    }, 1000 * (index + 1)); // Discover a new device every second

                    // Store the timeout for later cleanup
                    if (this.simulationTimeout) clearTimeout(this.simulationTimeout);
                    this.simulationTimeout = timeout;
                });
            }
        } catch (error) {
            console.error('Error starting scan:', error);
            this.isSimulationMode = true;

            // Try again in simulation mode
            if (!this.isSimulationMode) {
                this.stopScan();
                this.startScan();
            }
        }

        // Auto-stop scan after 30 seconds to save battery
        setTimeout(() => {
            if (this.isScanning) {
                this.stopScan();
            }
        }, 30000);
    };

    // Stop scanning for BLE devices
    stopScan = () => {
        if (!this.isScanning) return;

        this.isScanning = false;

        try {
            if (this.manager && !this.isSimulationMode) {
                this.manager.stopDeviceScan();
            }

            // Clear any pending simulated device discoveries
            if (this.simulationTimeout) {
                clearTimeout(this.simulationTimeout);
                this.simulationTimeout = null;
            }
        } catch (error) {
            console.error('Error stopping scan:', error);
        }
    };

    // Connect to a BLE device
    connectToDevice = async (deviceId: string, retryCount: number = 3): Promise<Device | null> => {
        try {
            if (this.manager && !this.isSimulationMode) {
                // Real Bluetooth connection
                const device = this.devices.get(deviceId);
                if (!device) {
                    console.error('Device not found');
                    return null;
                }

                this.stopScan();

                try {
                    const connectedDevice = await device.connect();
                    const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();

                    this.connectedDevice = discoveredDevice;

                    if (this.onConnectionStatusChangeCallback) {
                        this.onConnectionStatusChangeCallback(true, discoveredDevice);
                    }

                    // Setup disconnect listener
                    connectedDevice.onDisconnected((error, disconnectedDevice) => {
                        this.connectedDevice = null;
                        if (this.onConnectionStatusChangeCallback) {
                            this.onConnectionStatusChangeCallback(false, null);
                        }
                    });

                    return discoveredDevice;
                } catch (error) {
                    console.error(`Connection attempt failed (${retryCount} retries left):`, error);
                    if (retryCount > 0) {
                        console.log(`Retrying connection to ${deviceId}...`);
                        // Wait a bit before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return this.connectToDevice(deviceId, retryCount - 1);
                    } else if (!this.isSimulationMode) {
                        // Fall back to simulation mode
                        console.warn('Falling back to simulation mode after connection failures');
                        this.isSimulationMode = true;

                        // Create and connect to a mock device with the same ID
                        const mockDevice = new MockDevice(deviceId, `PayBit User (Simulated)`);
                        this.mockDevices.set(mockDevice.id, mockDevice);
                        return this.connectToDevice(deviceId, 0);
                    } else {
                        throw error;
                    }
                }
            } else {
                // Simulated Bluetooth connection
                let mockDevice = this.mockDevices.get(deviceId);
                if (!mockDevice) {
                    // Create a mock device if it doesn't exist
                    mockDevice = new MockDevice(deviceId, `Device ${deviceId.substring(0, 4)}`);
                    this.mockDevices.set(deviceId, mockDevice);
                }

                this.stopScan();

                // Simulate connection delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                this.connectedDevice = mockDevice as unknown as Device;

                if (this.onConnectionStatusChangeCallback) {
                    this.onConnectionStatusChangeCallback(true, this.connectedDevice);
                }

                return this.connectedDevice;
            }
        } catch (error) {
            console.error('Connection error:', error);
            return null;
        }
    };

    // Read from a characteristic
    readCharacteristic = async (): Promise<string | null> => {
        if (!this.connectedDevice) {
            console.error('No device connected');
            return null;
        }

        try {
            if (this.manager && !this.isSimulationMode) {
                // Real Bluetooth reading
                const services = await this.connectedDevice.services();
                for (const service of services) {
                    if (service.uuid === SERVICE_UUID) {
                        const characteristics = await service.characteristics();
                        for (const characteristic of characteristics) {
                            if (characteristic.uuid === CHARACTERISTIC_UUID) {
                                const value = await characteristic.read();
                                if (value && value.value) {
                                    const decodedValue = Buffer.from(value.value, 'base64').toString('utf8');
                                    return decodedValue;
                                }
                            }
                        }
                    }
                }
                return null;
            } else {
                // Simulated Bluetooth reading
                // Return the stored mock receiver info or payment data
                await new Promise(resolve => setTimeout(resolve, 500));
                return this.mockReceiverInfo;
            }
        } catch (error) {
            console.error('Error reading characteristic:', error);

            // Fall back to simulation if real read fails
            if (!this.isSimulationMode) {
                this.isSimulationMode = true;
                console.warn('Falling back to simulation mode due to read error');
                return this.readCharacteristic();
            }

            return null;
        }
    };

    // Write to a characteristic
    writeCharacteristic = async (data: string): Promise<boolean> => {
        if (!this.connectedDevice) {
            console.error('No device connected');
            return false;
        }

        try {
            if (this.manager && !this.isSimulationMode) {
                // Real Bluetooth writing
                const services = await this.connectedDevice.services();
                for (const service of services) {
                    if (service.uuid === SERVICE_UUID) {
                        const characteristics = await service.characteristics();
                        for (const characteristic of characteristics) {
                            if (characteristic.uuid === CHARACTERISTIC_UUID) {
                                await characteristic.writeWithResponse(
                                    Buffer.from(data).toString('base64')
                                );
                                return true;
                            }
                        }
                    }
                }
                return false;
            } else {
                // Simulated Bluetooth writing
                await new Promise(resolve => setTimeout(resolve, 500));
                this.mockReceiverInfo = data;
                return true;
            }
        } catch (error) {
            console.error('Error writing characteristic:', error);

            // Fall back to simulation if real write fails
            if (!this.isSimulationMode) {
                this.isSimulationMode = true;
                console.warn('Falling back to simulation mode due to write error');
                return this.writeCharacteristic(data);
            }

            return false;
        }
    };

    // Disconnect from the device
    disconnect = async (): Promise<void> => {
        if (this.connectedDevice) {
            try {
                if (this.manager && !this.isSimulationMode) {
                    await this.connectedDevice.cancelConnection();
                }

                // For both real and simulated, clear the device
                this.connectedDevice = null;

                if (this.onConnectionStatusChangeCallback) {
                    this.onConnectionStatusChangeCallback(false, null);
                }
            } catch (error) {
                console.error('Error disconnecting:', error);
                // Always clean up even if there's an error
                this.connectedDevice = null;
            }
        }
    };

    // Register callback for device discovery
    onDeviceDiscovered = (callback: (device: Device) => void) => {
        this.onDeviceDiscoveredCallback = callback;
    };

    // Register callback for connection status change
    onConnectionStatusChange = (callback: (connected: boolean, device: Device | null) => void) => {
        this.onConnectionStatusChangeCallback = callback;
    };

    // Register callback for Bluetooth state changes
    onBluetoothStateChange = (callback: (state: string) => void) => {
        this.onBluetoothStateChangeCallback = callback;
    };

    // Cleanup resources
    destroy = () => {
        this.stopScan();
        if (this.connectedDevice) {
            this.disconnect();
        }
        if (this.manager && !this.isSimulationMode) {
            try {
                this.manager.destroy();
            } catch (error) {
                console.error('Error destroying BLE manager:', error);
            }
        }

        // Clear any simulated timeouts
        if (this.simulationTimeout) {
            clearTimeout(this.simulationTimeout);
            this.simulationTimeout = null;
        }

        // Clear callbacks
        this.onDeviceDiscoveredCallback = null;
        this.onConnectionStatusChangeCallback = null;
        this.onBluetoothStateChangeCallback = null;
    };

    // Store device information as receiver
    setupAsReceiver = async (userId: string, userFullName: string): Promise<boolean> => {
        try {
            const receiverInfo = JSON.stringify({
                id: userId,
                name: userFullName,
                timestamp: new Date().toISOString()
            });

            // Store receiver info for retrieval
            await AsyncStorage.setItem('bluetooth_receiver_info', receiverInfo);

            if (this.isSimulationMode) {
                // In simulation mode, store the receiver info for the mock device
                this.mockReceiverInfo = receiverInfo;

                // Simulate a payment after 5 seconds in simulation mode
                if (this.simulationTimeout) {
                    clearTimeout(this.simulationTimeout);
                }

                this.simulationTimeout = setTimeout(() => {
                    if (this.onConnectionStatusChangeCallback) {
                        // Create a mock payment
                        const mockPayment = JSON.stringify({
                            success: true,
                            amount: 0.005,
                            senderId: 'simulated-sender-id',
                            senderName: 'Simulated Sender'
                        });

                        this.mockReceiverInfo = mockPayment;

                        // Create a mock device for the sender
                        const mockSender = new MockDevice('sender-device', 'Simulated Sender');
                        this.connectedDevice = mockSender as unknown as Device;

                        // Notify about the connection
                        this.onConnectionStatusChangeCallback(true, this.connectedDevice);

                        // After some time, disconnect
                        setTimeout(() => {
                            this.disconnect();
                        }, 10000);
                    }
                }, 5000);
            }

            return true;
        } catch (error) {
            console.error('Error setting up as receiver:', error);
            return false;
        }
    };

    // Get the connection status
    isConnected = (): boolean => {
        return this.connectedDevice !== null;
    };

    // Get the current connected device
    getConnectedDevice = (): Device | null => {
        return this.connectedDevice;
    };

    // Add function to check if a device is a probable PayBit device
    isPayBitDevice = (device: Device): boolean => {
        // Check if device name contains PayBit
        if (device.name && device.name.toLowerCase().includes('paybit')) {
            return true;
        }

        // Also check for any typical mobile device names that might be running PayBit
        const mobileDeviceKeywords = ['iphone', 'galaxy', 'pixel', 'android', 'oneplus', 'xiaomi'];
        if (device.name) {
            const deviceNameLower = device.name.toLowerCase();
            if (mobileDeviceKeywords.some(keyword => deviceNameLower.includes(keyword))) {
                return true;
            }
        }

        return false;
    };

    // Get all discovered devices
    getDiscoveredDevices = (): Device[] => {
        return Array.from(this.devices.values());
    };

    // Get PayBit devices from discovered devices
    getPayBitDevices = (): Device[] => {
        return Array.from(this.devices.values()).filter(device => this.isPayBitDevice(device));
    };

    // Auto-connect to the best available device
    autoConnect = async (): Promise<Device | null> => {
        // First try to find devices with "PayBit" in the name
        const paybitDevices = this.getPayBitDevices();

        if (paybitDevices.length > 0) {
            // Sort by signal strength if available (RSSI)
            const sortedDevices = paybitDevices.sort((a, b) => {
                const rssiA = a.rssi || -100;
                const rssiB = b.rssi || -100;
                return rssiB - rssiA; // Higher RSSI (less negative) is better
            });

            // Connect to the device with strongest signal
            return await this.connectToDevice(sortedDevices[0].id);
        }

        // If no PayBit devices, return null
        return null;
    };
}

// Singleton instance
export default new BluetoothService(); 