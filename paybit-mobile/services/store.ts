import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

const apiEndpoint = 'http://192.168.45.72:3000';

export type Transaction = {
    id: string;
    date: string;
    direction: 'sent' | 'received';
    counterpartyName: string;
    counterpartyId: string;
    amount: number;
    status: string;
    description: string;
    reference: string;
    email: string;
    campaignId?: string;
};

export type UserData = {
    token: string;
    userID: string;
    userUID: string;
    userFullName: string;
    userProfileImage?: string;
    balance: string;
    btcToUsd: number;
    btcToEur: number;
    userEmail: string;
    tapRootAddress?: string;
};

type StoreState = {
    user: UserData;
    transactions: Transaction[];
    isAuthenticated: boolean;
    isLoading: boolean;
};

type StoreActions = {
    setUser: (userData: Partial<UserData>) => void;
    setTransactions: (transactions: Transaction[]) => void;
    resetStore: () => void;
    logout: () => void;
};

export type Store = StoreState & StoreActions;

const initialUserData: UserData = {
    token: '',
    userID: '',
    userUID: '',
    userFullName: '',
    userProfileImage: undefined,
    balance: '',
    btcToUsd: 0,
    btcToEur: 0,
    userEmail: '',
};

const initialState: StoreState = {
    user: initialUserData,
    transactions: [],
    isAuthenticated: false,
    isLoading: true,
};

// Selector functions
export const selectUser = (state: Store) => state.user;
export const selectTransactions = (state: Store) => state.transactions;
export const selectIsAuthenticated = (state: Store) => state.isAuthenticated;
export const selectIsLoading = (state: Store) => state.isLoading;
export const selectSetUser = (state: Store) => state.setUser;
export const selectSetTransactions = (state: Store) => state.setTransactions;
export const selectResetStore = (state: Store) => state.resetStore;

export const selectLogout = (state: Store) => state.logout;

export const useStore = create<Store>()(
    persist(
        (set) => ({
            ...initialState,
            setUser: (userData: Partial<UserData>) => {
                set((state) => ({
                    user: { ...state.user, ...userData },
                    isAuthenticated: !!userData.token,
                }));
            },
            setTransactions: (transactions: Transaction[]) => set({ transactions }),
            resetStore: () => set(initialState),
            logout: () => {
                // First reset the application state immediately
                set(initialState);

                // Force storage clearing using a synchronous pattern
                try {
                    // Create a direct, synchronous approach to clear storage
                    AsyncStorage.getAllKeys()
                        .then(keys => {
                            console.log('Clearing all storage keys:', keys);
                            return AsyncStorage.multiRemove(keys);
                        })
                        .then(() => {
                            console.log('All storage cleared successfully');

                            // Now set the logout flag as a completely new value
                            return AsyncStorage.setItem('paybit-FORCE-LOGOUT', 'true');
                        })
                        .then(() => {
                            console.log('Logout flag set successfully');

                            // Force navigation after a small delay to ensure storage operations complete
                            setTimeout(() => {
                                console.log('Navigating to login screen');
                                router.replace('/(auth)/login');
                            }, 100);
                        });
                } catch (error) {
                    console.error('Error in logout process:', error);

                    // Fallback navigation if anything fails
                    router.replace('/(auth)/login');
                }
            },
        }),
        {
            name: 'paybit-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
