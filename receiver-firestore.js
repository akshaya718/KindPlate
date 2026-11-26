
import { db } from "./firebase.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    collection,
    onSnapshot,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import { requestFood } from "./request-firestore.js";

const auth = getAuth();

const donationList = document.getElementById("donationList");
const myRequestList = document.getElementById("myRequestList");

onAuthStateChanged(auth, function (user) {

    if (!donationList || !myRequestList) return;

    if (!user) {
        donationList.textContent = "Please login to view donations.";
        myRequestList.textContent = "Please login to view your requests.";
        return;
    }

    // DISPLAY AVAILABLE FOOD DONATIONS

    onSnapshot(collection(db, "donations"), function (snapshot) {

        donationList.innerHTML = "";

        let availableCount = 0;

        snapshot.forEach(function (donationDoc) {

            const donation = donationDoc.data();

            if (donation.status !== "Available") return;

            if (donation.donorId === user.uid) return;

            const availableQuantity = Number(donation.quantity);

            if (
                !Number.isFinite(availableQuantity) ||
                availableQuantity <= 0
            ) {
                return;
            }

            const card = document.createElement("div");
            card.className = "donation-card";

            const heading = document.createElement("h3");
            heading.textContent = donation.foodName;

            const details = document.createElement("p");
            details.textContent =
                "Category: " + donation.category +
                " | Available: " + availableQuantity +
                " " + donation.unit;

            const location = document.createElement("p");
            location.textContent =
                "Location: " + donation.location;

            const deadline = document.createElement("p");
            deadline.textContent =
                "Pickup Deadline: " + donation.deadline;

            const description = document.createElement("p");
            description.textContent =
                "Details: " + donation.details;

            const quantityLabel = document.createElement("label");
            quantityLabel.textContent =
                "Enter quantity needed (" + donation.unit + "): ";

            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.min = "1";
            quantityInput.max = String(availableQuantity);
            quantityInput.placeholder = "Enter quantity";
            quantityInput.required = true;

            const button = document.createElement("button");
            button.textContent = "Request Food";

            button.addEventListener("click", function () {

                const requestedQuantity =
                    Number(quantityInput.value);

                if (
                    !Number.isFinite(requestedQuantity) ||
                    requestedQuantity <= 0 ||
                    requestedQuantity > availableQuantity
                ) {
                    alert("Please enter a valid quantity.");
                    return;
                }

                requestFood(
                    donationDoc.id,
                    donation.donorId,
                    user.uid,
                    requestedQuantity
                );
            });

            card.appendChild(heading);
            card.appendChild(details);
            card.appendChild(location);
            card.appendChild(deadline);
            card.appendChild(description);
            card.appendChild(quantityLabel);
            card.appendChild(quantityInput);
            card.appendChild(button);

            donationList.appendChild(card);

            availableCount++;

        });

        if (availableCount === 0) {
            donationList.textContent =
                "No food donations currently available.";
        }

    }, function (error) {

        donationList.textContent =
            "Error loading donations: " + error.message;

    });


    // DISPLAY MY FOOD REQUESTS

    const requestQuery = query(
        collection(db, "requests"),
        where("receiverId", "==", user.uid)
    );

    onSnapshot(requestQuery, async function (snapshot) {

        myRequestList.innerHTML = "";

        if (snapshot.empty) {
            myRequestList.textContent =
                "You have not made any food requests yet.";
            return;
        }

        for (const requestDoc of snapshot.docs) {

            const request = requestDoc.data();

            let foodName = request.foodName || "";
            let category = request.category || "";

            // Get old donation details if missing

            if ((!foodName || !category) && request.donationId) {

                try {

                    const donationRef = doc(
                        db,
                        "donations",
                        request.donationId
                    );

                    const donationSnapshot =
                        await getDoc(donationRef);

                    if (donationSnapshot.exists()) {

                        const donation = donationSnapshot.data();

                        foodName = foodName || donation.foodName;
                        category = category || donation.category;
                    }

                } catch (error) {

                    console.log(
                        "Could not load donation details:",
                        error
                    );

                }
            }

            const card = document.createElement("div");
            card.className = "donation-card";

            const heading = document.createElement("h3");
            heading.textContent = foodName || "Food Request";

            const categoryText = document.createElement("p");
            categoryText.textContent =
                "Category: " + (category || "Not specified");

            const quantityText = document.createElement("p");
            quantityText.textContent =
                "Requested Quantity: " +
                (request.requestedQuantity ?? "Not recorded");

            const statusText = document.createElement("p");
            statusText.textContent =
                "Status: " + (request.status || "Unknown");

            const statusUpdate = document.createElement("p");

            if (request.quantityUpdateStatus === "Pending") {

                statusUpdate.textContent =
                    "Quantity increase is waiting for donor approval.";

            } else if (
                request.quantityUpdateStatus === "Approved"
            ) {

                statusUpdate.textContent =
                    "Quantity increase approved.";

            }

            card.appendChild(heading);
            card.appendChild(categoryText);
            card.appendChild(quantityText);
            card.appendChild(statusText);

            if (statusUpdate.textContent) {
                card.appendChild(statusUpdate);
            }

            myRequestList.appendChild(card);

        }

    }, function (error) {

        myRequestList.textContent =
            "Error loading requests: " + error.message;

    });

});
