import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { isEmailAllowed, signOutUser } from './auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthorized: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Check if user is in whitelist
                if (isEmailAllowed(currentUser.email)) {
                    setUser(currentUser);
                    setIsAuthorized(true);
                } else {
                    console.error("[AUTH] Access Denied: User not whitelisted.", currentUser.email);
                    setUser(null);
                    setIsAuthorized(false);
                    await signOutUser();
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        loading,
        isAuthorized,
        signIn: async () => {
            // This will be triggered by a button in the UI
        },
        signOut: signOutUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
