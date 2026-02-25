import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect,
    signOut, 
    User,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../firebase';

/**
 * WHITELISTED EMAILS
 * 
 * Only users with emails in this list will be allowed to access the chat.
 * Add authorized emails here.
 */
export const ALLOWED_EMAILS = [
    "manas.abduldaev@gmail.com",
    "manasabduldaev@gmail.com",
    "admin@streamflow.app",
    "amanas5535332@gmail.com"
];

/**
 * Check if a user's email is whitelisted
 */
export const isEmailAllowed = (email: string | null): boolean => {
    // Whitelist disabled - allow all Google authenticated users
    return true; 
    /* 
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    return ALLOWED_EMAILS.includes(normalized);
    */
};

/**
 * Sign in with Google Redirect (More robust for Mobile/Safari)
 */
export const signInWithGoogleRedirect = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithRedirect(auth, provider);
        // Page will redirect, no return value here.
    } catch (error: any) {
        console.error("[AUTH] Google Redirect Error:", error);
        throw error;
    }
};

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // OPTIONAL: Force account selection if needed
    // provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log("[AUTH] Successfully authenticated via Google:", user.email);

        /* Whitelist check disabled for public access
        if (!isEmailAllowed(user.email)) {
            console.error("[AUTH] Access Denied: Email not in whitelist.", user.email);
            await signOut(auth);
            throw new Error("ACCESS_DENIED");
        }
        */
        
        return user;
    } catch (error: any) {
        console.error("[AUTH] Google Sign-In Error Details:", {
            code: error.code,
            message: error.message,
            customData: error.customData
        });
        throw error;
    }
};

/**
 * Sign out user
 */
export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("[AUTH] Sign-Out Error:", error);
        throw error;
    }
};

export * from './AuthProvider';
