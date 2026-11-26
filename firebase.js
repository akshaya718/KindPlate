
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import {
    initializeAppCheck,
    ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app-check.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJKkZiBI6Qb8J_kAfq38jscZJdqY8Grvk",
    authDomain: "kindplate-48d21.firebaseapp.com",
    projectId: "kindplate-48d21",
    storageBucket: "kindplate-48d21.firebasestorage.app",
    messagingSenderId: "234731298215",
    appId: "1:234731298215:web:0329c8a5ddd8b995ca2a82",
    measurementId: "G-C7GZV3X9BC"
};

const app = initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
        "6LcoFDMuAAAAADMocPVA8fkCmuaGmwFNBlZ2XCD4"
    ),
    isTokenAutoRefreshEnabled: true
});

const db = getFirestore(app);

console.log("KindPlate Firebase connected!");
console.log("KindPlate App Check connected!");
console.log("KindPlate Firestore connected!");

export { app, db, appCheck };
