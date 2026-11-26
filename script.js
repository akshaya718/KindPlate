
// SHOW LOGIN PAGE
function showLogin() {
    window.location.href = "login.html";
}


// RECEIVER DASHBOARD
document.addEventListener("DOMContentLoaded", function () {

    const donationList = document.getElementById("donationList");

    if (donationList) {

        let donations = JSON.parse(
            localStorage.getItem("donations") || "[]"
        );

        if (donations.length === 0) {

            donationList.innerHTML =
                "<p>No food donations available yet.</p>";

        } else {

            donations.forEach(function (donation, index) {

                let card = document.createElement("div");
                card.className = "donation-card";

                let heading = document.createElement("h3");
                heading.textContent = donation.foodName;

                let details = document.createElement("p");
                details.textContent =
                    "Category: " + donation.category +
                    " | Quantity: " + donation.quantity + " " + donation.unit;

                let deadline = document.createElement("p");
                deadline.textContent =
                    "Pickup Deadline: " + donation.deadline;

                let location = document.createElement("p");
                location.textContent =
                    "Location: " + donation.location;

                let description = document.createElement("p");
                description.textContent =
                    "Details: " + (donation.details || "Not provided");

                let button = document.createElement("button");
                button.textContent = "Request Food";

                button.onclick = function () {
                    requestFood(index);
                };

                card.appendChild(heading);
                card.appendChild(details);
                card.appendChild(deadline);
                card.appendChild(location);
                card.appendChild(description);
                card.appendChild(button);

                donationList.appendChild(card);
            });
        }
    }
});


// REQUEST FOOD
function requestFood(index) {

    let requests = JSON.parse(
        localStorage.getItem("foodRequests") || "[]"
    );

    requests.push({
        donationIndex: index,
        status: "Requested"
    });

    localStorage.setItem("foodRequests", JSON.stringify(requests));

    alert("Food request submitted successfully!");
}


// AI FOOD ASSISTANT
function generateFoodDetails() {

    let foodText = document.getElementById("foodInput").value;

    let result = document.getElementById("aiResult");

    if (foodText.trim() === "") {

        result.textContent = "Please enter your food details.";
        return;
    }

    result.innerHTML = `
        <h3>Donation Information</h3>

        <p><b>Your Description:</b></p>

        <p></p>

        <p><b>Next Step:</b> Add the food category, quantity,
        preparation time, storage details and pickup deadline.</p>

        <p><b>Reminder:</b> Follow applicable food safety guidelines.
        This assistant does not verify food safety.</p>
    `;

    result.querySelector("p:nth-of-type(2)").textContent = foodText;
}
