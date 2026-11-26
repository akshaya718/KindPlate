
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, updateProfile }
from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import { app } from "./firebase.js";

const auth = getAuth(app);

// Register a new user
export async function registerUser(name, email, password) {
    const userCredential = await createUserWithEmailAndPassword(
        auth, email, password
    );

    await updateProfile(userCredential.user, {
        displayName: name
    });

    return userCredential.user;
}

// Login an existing user
export async function loginUser(email, password) {
    const userCredential = await signInWithEmailAndPassword(
        auth, email, password
    );

    return userCredential.user;
}
