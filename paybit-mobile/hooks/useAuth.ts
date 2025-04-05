import { useState } from 'react';
import { login, register, logout } from '../services/api/auth';

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await login(email, password);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await register(email, password);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await logout();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
    };
}; 