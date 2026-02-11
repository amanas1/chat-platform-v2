import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    User 
} from 'firebase/auth';
import { auth } from './firebase';

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
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    return ALLOWED_EMAILS.includes(normalized);
};

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // OPTIONAL: Force account selection if needed
    // provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log("[AUTH] Successfully authenticated via Google:", user.email);

        if (!isEmailAllowed(user.email)) {
            console.error("[AUTH] Access Denied: Email not in whitelist.", user.email);
            await signOut(auth);
            throw new Error("ACCESS_DENIED");
        }
        
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
