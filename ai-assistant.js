
import { app } from "./firebase.js";

import {
    getAI,
    getGenerativeModel,
    GoogleAIBackend
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-ai.js";

// =================================
// INITIALIZE FIREBASE AI
// =================================

const ai = getAI(app, {
    backend: new GoogleAIBackend()
});

// Initialize Gemini model
const model = getGenerativeModel(
    ai,
    {
        model: "gemini-3.5-flash-lite"
    },
    {
        timeout: 300000
    }
);

// =================================
// GET HTML ELEMENTS
// =================================

const chatBox = document.getElementById("chatBox");
const userMessage = document.getElementById("userMessage");
const sendButton = document.getElementById("sendButton");

// =================================
// FORMAT AI RESPONSE
// =================================

function formatAIMessage(message) {

    // Convert escaped newlines into actual newlines
    let text = message
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\\r?\n/g, "\n")
        .replace(/\r\n/g, "\n");

    // Remove unnecessary backslashes before Markdown symbols
    text = text.replace(/\\\*/g, "*");

    // Put numbered steps on separate lines
    text = text.replace(
        /(^|\s)(\d+)\.\s+/g,
        function(match, prefix, number) {

            return (prefix ? "\n\n" : "") + number + ". ";

        }
    );

    // Escape HTML characters
    let safeMessage = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Convert bold Markdown
    safeMessage = safeMessage.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Convert italic Markdown
    safeMessage = safeMessage.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );

    // Convert newlines into HTML line breaks
    safeMessage = safeMessage.replace(/\n/g, "<br>");

    return safeMessage;
}

// =================================
// DISPLAY CHAT MESSAGES
// =================================

function addMessage(message, sender) {

    const messageDiv = document.createElement("div");

    messageDiv.className =
        sender === "user" ? "user-message" : "ai-message";

    if (sender === "ai") {

        messageDiv.innerHTML = formatAIMessage(message);

    } else {

        messageDiv.textContent = message;

    }

    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

// =================================
// SEND MESSAGE TO GEMINI
// =================================

async function sendMessage() {

    const message = userMessage.value.trim();

    if (message === "" || sendButton.disabled) {
        return;
    }

    // Display user message
    addMessage(message, "user");

    userMessage.value = "";

    // Display loading message
    const loadingMessage = document.createElement("div");

    loadingMessage.className = "ai-message";
    loadingMessage.textContent = "Thinking...";

    chatBox.appendChild(loadingMessage);

    chatBox.scrollTop = chatBox.scrollHeight;

    sendButton.disabled = true;

    try {

        const prompt = `
You are KindPlate AI Food Assistant.

KindPlate is a food rescue platform connecting food donors
with people and organizations that need food.

YOUR RESPONSIBILITIES:

1. Explain food donation.
2. Explain food categories.
3. Help reduce food waste.
4. Explain how donors and receivers use KindPlate.
5. Suggest responsible donation practices.
6. Answer food rescue and sustainability questions.

RESPONSE FORMATTING RULES:

- Give simple and friendly answers.
- Use short paragraphs.
- Use bold headings.
- Put every numbered step on a separate line.
- Use this exact format:

1. **First Step:** Explanation.

2. **Second Step:** Explanation.

3. **Third Step:** Explanation.

- Never combine numbered steps into one paragraph.
- Leave a blank line between steps.
- Keep numbered steps in correct order.
- Use a separate paragraph for safety notes.
- Avoid unnecessarily long answers.

FOOD SAFETY RULES:

- Never guarantee that food is safe to eat.
- Recommend proper inspection before donation.
- For food safety concerns, recommend a responsible
  food safety professional.

USER QUESTION:

${message}
`;

        const result = await model.generateContent(prompt);

        const response = result.response.text();

        loadingMessage.remove();

        addMessage(response, "ai");

    } catch (error) {

        console.error("Gemini Error:", error);

        loadingMessage.remove();

        addMessage(
            "Sorry, the AI service is temporarily unavailable. Please try again later.",
            "ai"
        );

    } finally {

        sendButton.disabled = false;

    }
}

// =================================
// SEND BUTTON
// =================================

sendButton.addEventListener("click", sendMessage);

// =================================
// SEND USING ENTER KEY
// =================================

userMessage.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

    }

});
