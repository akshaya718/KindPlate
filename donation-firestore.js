
import { db, app } from "./firebase.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", function () {

    const donationForm = document.getElementById("donationForm");

    if (!donationForm) return;

    donationForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const user = auth.currentUser;

        if (!user) {
            alert("Please login before adding a donation.");
            return;
        }

        const donation = {
            donorId: user.uid,
            donorName: user.displayName || "",
            foodName: document.getElementById("foodName").value,
            category: document.getElementById("category").value,
            quantity: document.getElementById("quantity").value,
            unit: document.getElementById("unit").value,
            deadline: document.getElementById("pickupDeadline").value,
            location: document.getElementById("location").value,
            details: document.getElementById("foodDetails").value,
            status: "Available",
            createdAt: serverTimestamp()
        };

        try {

            await addDoc(collection(db, "donations"), donation);

            document.getElementById("donationMessage").textContent =
                "Donation saved successfully in KindPlate!";

            donationForm.reset();

        } catch (error) {

            alert("Could not save donation: " + error.message);

        }

    });

});
