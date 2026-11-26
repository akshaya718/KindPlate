
import { db, app } from "./firebase.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const auth = getAuth(app);

export async function requestFood(
    donationId,
    donorId,
    receiverId,
    requestedQuantity
) {
    const user = auth.currentUser;

    if (!user || user.uid !== receiverId) {
        alert("Please login as a receiver.");
        return;
    }

    try {
        // Check the latest donation quantity
        const donationSnap = await getDoc(
            doc(db, "donations", donationId)
        );

        if (!donationSnap.exists()) {
            alert("This donation is no longer available.");
            return;
        }

        const donation = donationSnap.data();
        const availableQuantity = Number(donation.quantity);

        if (
            donation.status !== "Available" ||
            !Number.isFinite(availableQuantity) ||
            availableQuantity <= 0
        ) {
            alert("This food is no longer available.");
            return;
        }

        if (
            !Number.isFinite(Number(requestedQuantity)) ||
            Number(requestedQuantity) <= 0 ||
            Number(requestedQuantity) > availableQuantity
        ) {
            alert("Please enter a valid quantity within the remaining amount.");
            return;
        }

        // Check existing requests
        const existingQuery = query(
            collection(db, "requests"),
            where("donationId", "==", donationId),
            where("receiverId", "==", receiverId)
        );

        const existingRequests = await getDocs(existingQuery);
        const requests = existingRequests.docs;

        // Check pending request
        const pendingRequest = requests.find(function (item) {
            return item.data().status === "Requested";
        });

        if (pendingRequest) {
            alert("Your previous request is still waiting for approval.");
            return;
        }

        // Check accepted request
        const acceptedRequest = requests.find(function (item) {
            return item.data().status === "Accepted";
        });

        if (acceptedRequest) {
            const oldData = acceptedRequest.data();

            if (oldData.quantityUpdateStatus === "Pending") {
                alert("Your quantity update is already waiting for donor approval.");
                return;
            }

            const oldQuantity = Number(oldData.requestedQuantity || 0);

            if (Number(requestedQuantity) <= oldQuantity) {
                alert("Please enter a quantity greater than your previous request.");
                return;
            }

            await updateDoc(
                doc(db, "requests", acceptedRequest.id),
                {
                    previousQuantity: oldQuantity,
                    requestedQuantity: Number(requestedQuantity),
                    quantityUpdateStatus: "Pending",
                    quantityUpdateTime: serverTimestamp()
                }
            );

            alert("Quantity increase request sent to the donor!");
            return;
        }

        // Get receiver profile
        const profileSnap = await getDoc(
            doc(db, "users", receiverId)
        );

        if (!profileSnap.exists()) {
            alert("Receiver profile not found.");
            return;
        }

        const profile = profileSnap.data();

        // Validate receiver details
        if (!profile.name || !profile.email) {
            alert("Receiver name or email is missing in the user profile.");
            return;
        }

        // Create food request
        const foodRequest = {
            donationId: donationId,
            donorId: donorId,
            receiverId: receiverId,

            // Food details
            foodName: donation.foodName,
            category: donation.category,

            // Receiver details
            receiverName: profile.name,
            receiverEmail: profile.email,

            requestedQuantity: Number(requestedQuantity),

            quantityUpdateStatus: "None",
            status: "Requested",

            createdAt: serverTimestamp()
        };

        await addDoc(
            collection(db, "requests"),
            foodRequest
        );

        alert("Food request submitted successfully!");

    } catch (error) {
        alert("Could not submit request: " + error.message);
    }
}
