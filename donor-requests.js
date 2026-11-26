
import { db } from "./firebase.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const auth = getAuth();

const activeList = document.getElementById("donorRequestList");
const pastList = document.getElementById("pastRequestList");

onAuthStateChanged(auth, function (user) {

    if (!user) {
        activeList.textContent = "Please login.";
        pastList.textContent = "Please login.";
        return;
    }

    const q = query(
        collection(db, "requests"),
        where("donorId", "==", user.uid)
    );

    onSnapshot(q, async function (snapshot) {

        activeList.innerHTML = "";
        pastList.innerHTML = "";

        let activeCount = 0;
        let pastCount = 0;

        for (const requestDoc of snapshot.docs) {

            const request = requestDoc.data();

            // Get food details for old requests too
            let foodName = request.foodName || "Not available";
            let category = request.category || "Not available";

            if (
                (!request.foodName || !request.category) &&
                request.donationId
            ) {
                try {
                    const donationSnap = await getDoc(
                        doc(db, "donations", request.donationId)
                    );

                    if (donationSnap.exists()) {
                        const donation = donationSnap.data();

                        foodName = donation.foodName || foodName;
                        category = donation.category || category;
                    }

                } catch (error) {
                    console.log("Could not load food details:", error.message);
                }
            }

            const card = document.createElement("div");
            card.className = "donation-card";

            const heading = document.createElement("h3");
            heading.textContent = "Food Request";

            const food = document.createElement("p");
            food.textContent = "Food Name: " + foodName;

            const foodCategory = document.createElement("p");
            foodCategory.textContent = "Category: " + category;

            const receiver = document.createElement("p");
            receiver.textContent =
                "Receiver: " + (request.receiverName || "Not available");

            const email = document.createElement("p");
            email.textContent =
                "Email: " + (request.receiverEmail || "Not available");

            const quantity = document.createElement("p");
            quantity.textContent =
                "Requested Quantity: " +
                (request.requestedQuantity || "Not specified");

            const status = document.createElement("p");
            status.textContent = "Status: " + request.status;

            // PAST RECORDS
            if (
                request.status === "Completed" ||
                request.status === "Rejected"
            ) {

                const topRow = document.createElement("div");
                topRow.className = "past-request-header";

                const title = document.createElement("strong");
                title.textContent = foodName;

                const badge = document.createElement("span");
                badge.className = "request-status";
                badge.textContent = request.status;

                if (request.status === "Completed") {
                    badge.classList.add("completed-status");
                } else {
                    badge.classList.add("rejected-status");
                }

                topRow.appendChild(title);
                topRow.appendChild(badge);

                const details = document.createElement("div");
                details.className = "past-request-details";
                details.hidden = true;

                details.appendChild(food);
                details.appendChild(foodCategory);
                details.appendChild(receiver);
                details.appendChild(email);
                details.appendChild(quantity);
                details.appendChild(status);

                const viewButton = document.createElement("button");
                viewButton.textContent = "View Details";

                viewButton.addEventListener("click", function () {
                    details.hidden = !details.hidden;
                    viewButton.textContent =
                        details.hidden ? "View Details" : "Hide Details";
                });

                card.appendChild(topRow);
                card.appendChild(viewButton);
                card.appendChild(details);

                pastList.appendChild(card);
                pastCount++;

                continue;
            }

            // ACTIVE REQUESTS
            card.appendChild(heading);
            card.appendChild(food);
            card.appendChild(foodCategory);
            card.appendChild(receiver);
            card.appendChild(email);
            card.appendChild(quantity);
            card.appendChild(status);

            // ACCEPT REQUEST AND REDUCE AVAILABLE QUANTITY
            if (request.status === "Requested") {

                const acceptButton = document.createElement("button");
                acceptButton.textContent = "Accept Request";

                acceptButton.addEventListener("click", async function () {

                    try {

                        await runTransaction(db, async function (transaction) {

                            const requestRef = doc(
                                db, "requests", requestDoc.id
                            );

                            const donationRef = doc(
                                db, "donations", request.donationId
                            );

                            const requestSnap =
                                await transaction.get(requestRef);

                            const donationSnap =
                                await transaction.get(donationRef);

                            if (
                                !requestSnap.exists() ||
                                !donationSnap.exists()
                            ) {
                                throw new Error("Request or donation not found.");
                            }

                            const currentRequest = requestSnap.data();
                            const donation = donationSnap.data();

                            if (
                                currentRequest.status !== "Requested" ||
                                donation.donorId !== user.uid ||
                                currentRequest.donorId !== user.uid
                            ) {
                                throw new Error("This request cannot be accepted.");
                            }

                            const available = Number(donation.quantity);
                            const requested = Number(
                                currentRequest.requestedQuantity
                            );

                            if (
                                !Number.isFinite(available) ||
                                !Number.isFinite(requested) ||
                                requested <= 0 ||
                                requested > available ||
                                donation.status !== "Available"
                            ) {
                                throw new Error(
                                    "Not enough food quantity is available."
                                );
                            }

                            const remaining = available - requested;

                            transaction.update(donationRef, {
                                quantity: remaining,
                                status: remaining > 0 ? "Available" : "Reserved"
                            });

                            transaction.update(requestRef, {
                                status: "Accepted"
                            });

                        });

                        alert("Request accepted! Available quantity updated.");

                    } catch (error) {
                        alert(error.message);
                    }
                });

                const rejectButton = document.createElement("button");
                rejectButton.textContent = "Reject Request";

                rejectButton.addEventListener("click", async function () {

                    try {

                        await runTransaction(db, async function (transaction) {

                            const requestRef = doc(
                                db, "requests", requestDoc.id
                            );

                            const requestSnap =
                                await transaction.get(requestRef);

                            if (
                                !requestSnap.exists() ||
                                requestSnap.data().status !== "Requested" ||
                                requestSnap.data().donorId !== user.uid
                            ) {
                                throw new Error("Request is no longer pending.");
                            }

                            transaction.update(requestRef, {
                                status: "Rejected"
                            });

                        });

                        alert("Request rejected!");

                    } catch (error) {
                        alert(error.message);
                    }
                });

                card.appendChild(acceptButton);
                card.appendChild(rejectButton);
            }

            // QUANTITY UPDATE REQUEST
            if (
                request.status === "Accepted" &&
                request.quantityUpdateStatus === "Pending"
            ) {

                const previous = document.createElement("p");
                previous.textContent =
                    "Previous Quantity: " + request.previousQuantity;

                const updated = document.createElement("p");
                updated.textContent =
                    "New Requested Quantity: " + request.requestedQuantity;

                card.appendChild(previous);
                card.appendChild(updated);

                // APPROVE QUANTITY INCREASE
                const approveButton = document.createElement("button");
                approveButton.textContent = "Approve Quantity";

                approveButton.addEventListener("click", async function () {

                    try {

                        await runTransaction(db, async function (transaction) {

                            const requestRef = doc(
                                db, "requests", requestDoc.id
                            );

                            const donationRef = doc(
                                db, "donations", request.donationId
                            );

                            const requestSnap =
                                await transaction.get(requestRef);

                            const donationSnap =
                                await transaction.get(donationRef);

                            if (
                                !requestSnap.exists() ||
                                !donationSnap.exists()
                            ) {
                                throw new Error("Request or donation not found.");
                            }

                            const currentRequest = requestSnap.data();
                            const donation = donationSnap.data();

                            if (
                                currentRequest.status !== "Accepted" ||
                                currentRequest.quantityUpdateStatus !== "Pending" ||
                                currentRequest.donorId !== user.uid ||
                                donation.donorId !== user.uid
                            ) {
                                throw new Error(
                                    "Quantity update is no longer pending."
                                );
                            }

                            const oldQuantity =
                                Number(currentRequest.previousQuantity);

                            const newQuantity =
                                Number(currentRequest.requestedQuantity);

                            const available = Number(donation.quantity);
                            const extra = newQuantity - oldQuantity;

                            if (
                                !Number.isFinite(extra) ||
                                extra <= 0 ||
                                !Number.isFinite(available) ||
                                extra > available
                            ) {
                                throw new Error(
                                    "Not enough additional food is available."
                                );
                            }

                            const remaining = available - extra;

                            transaction.update(donationRef, {
                                quantity: remaining,
                                status: remaining > 0 ? "Available" : "Reserved"
                            });

                            transaction.update(requestRef, {
                                quantityUpdateStatus: "Approved"
                            });

                        });

                        alert("Quantity approved! Available quantity updated.");

                    } catch (error) {
                        alert(error.message);
                    }
                });

                // REJECT QUANTITY INCREASE
                const rejectUpdateButton = document.createElement("button");
                rejectUpdateButton.textContent = "Reject Quantity";

                rejectUpdateButton.addEventListener("click", async function () {

                    try {

                        await runTransaction(db, async function (transaction) {

                            const requestRef = doc(
                                db, "requests", requestDoc.id
                            );

                            const requestSnap =
                                await transaction.get(requestRef);

                            if (
                                !requestSnap.exists() ||
                                requestSnap.data().status !== "Accepted" ||
                                requestSnap.data().quantityUpdateStatus !== "Pending" ||
                                requestSnap.data().donorId !== user.uid
                            ) {
                                throw new Error(
                                    "Quantity update is no longer pending."
                                );
                            }

                            transaction.update(requestRef, {
                                requestedQuantity:
                                    requestSnap.data().previousQuantity,
                                quantityUpdateStatus: "Rejected"
                            });

                        });

                        alert("Quantity increase rejected!");

                    } catch (error) {
                        alert(error.message);
                    }
                });

                card.appendChild(approveButton);
                card.appendChild(rejectUpdateButton);
            }

            // MARK AS COMPLETED
            if (request.status === "Accepted") {

                const completeButton = document.createElement("button");
                completeButton.textContent = "Mark as Completed";

                completeButton.addEventListener("click", async function () {

                    try {

                        await runTransaction(db, async function (transaction) {

                            const requestRef = doc(
                                db, "requests", requestDoc.id
                            );

                            const requestSnap =
                                await transaction.get(requestRef);

                            if (
                                !requestSnap.exists() ||
                                requestSnap.data().status !== "Accepted" ||
                                requestSnap.data().donorId !== user.uid
                            ) {
                                throw new Error("Request is no longer active.");
                            }

                            transaction.update(requestRef, {
                                status: "Completed"
                            });

                        });

                        alert("Request completed!");

                    } catch (error) {
                        alert(error.message);
                    }
                });

                card.appendChild(completeButton);
            }

            activeList.appendChild(card);
            activeCount++;

        }

        if (activeCount === 0) {
            activeList.textContent = "No active requests.";
        }

        if (pastCount === 0) {
            pastList.textContent = "No past records yet.";
        }

    }, function (error) {
        activeList.textContent = "Error: " + error.message;
        pastList.textContent = "Error loading records.";
    });

});
