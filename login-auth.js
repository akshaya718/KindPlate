
import { registerUser, loginUser } from "./auth.js";
import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("loginForm");
    const registerTab = document.getElementById("registerTab");
    const loginTab = document.getElementById("loginTab");
    const nameGroup = document.getElementById("nameGroup");
    const roleGroup = document.getElementById("roleGroup");
    const nameInput = document.getElementById("name");
    const roleInput = document.getElementById("role");
    const formLabel = document.getElementById("formLabel");
    const formTitle = document.getElementById("formTitle");
    const formDescription = document.getElementById("formDescription");
    const submitButton = document.getElementById("submitButton");

    let isRegister = true;

    registerTab.addEventListener("click", function () {

        isRegister = true;

        nameGroup.style.display = "block";
        roleGroup.style.display = "block";

        nameInput.required = true;
        roleInput.required = true;

        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        formLabel.textContent = "CREATE YOUR ACCOUNT";
        formTitle.innerHTML = "Welcome to<br>something good.";
        formDescription.textContent =
            "Join the KindPlate community. Choose your role and get started.";

        submitButton.innerHTML =
            'Create my account <span>→</span>';
    });

    loginTab.addEventListener("click", function () {

        isRegister = false;

        nameGroup.style.display = "none";
        roleGroup.style.display = "block";

        nameInput.required = false;
        roleInput.required = true;

        registerTab.classList.remove("active");
        loginTab.classList.add("active");

        formLabel.textContent = "WELCOME BACK";
        formTitle.innerHTML = "Good to see<br>you again.";
        formDescription.textContent =
            "Sign in to continue your KindPlate journey.";

        submitButton.innerHTML =
            'Sign in to KindPlate <span>→</span>';
    });

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = nameInput.value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = roleInput.value;

        try {

            submitButton.disabled = true;
            submitButton.textContent = "Please wait...";

            let user;

            if (isRegister) {

                user = await registerUser(name, email, password);

                alert("Account created successfully!");

            } else {

                user = await loginUser(email, password);

                alert("Login successful!");
            }

            // Save user profile in Firestore
            await setDoc(doc(db, "users", user.uid), {

                name: isRegister
                    ? name
                    : (user.displayName || ""),

                email: user.email,
                role: role,
                updatedAt: serverTimestamp()

            }, { merge: true });

            localStorage.setItem("userName",
                isRegister ? name : (user.displayName || ""));

            localStorage.setItem("userRole", role);

            if (role === "donor") {
                window.location.href = "donor.html";
            } else {
                window.location.href = "receiver.html";
            }

        } catch (error) {

            alert("Error: " + error.message);

            submitButton.innerHTML = isRegister
                ? 'Create my account <span>→</span>'
                : 'Sign in to KindPlate <span>→</span>';

            submitButton.disabled = false;
        }

    });

});
