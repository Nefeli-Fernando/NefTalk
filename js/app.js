// ===== Settings =====
// If you get a 404 error, copy the exact model name from the code sample in Google AI Studio.
const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ===== Elements from index.html =====
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const messages = document.getElementById("messages");

// The conversation so far, so the bot remembers earlier messages
const history = [];

// ===== Send when the form is submitted (send button OR Enter key) =====
form.addEventListener("submit", function (event) {
    event.preventDefault();               // stop the page from reloading
    const text = input.value.trim();
    if (text === "") return;              // ignore empty messages

    sendMessage(text);
});

async function sendMessage(text) {
    addMessage("user", text);
    input.value = "";
    setBusy(true);

    const typing = showTyping();

    // remember what the user said
    history.push({ role: "user", parts: [{ text: text }] });

    try {
        const reply = await askGemini();
        history.push({ role: "model", parts: [{ text: reply }] });
        typing.remove();
        addMessage("bot", reply);
    } catch (error) {
        console.error(error);
        history.pop();                    // forget the failed message
        typing.remove();
        addMessage("bot", "Sorry, something went wrong: " + error.message);
    }

    setBusy(false);
    input.focus();
}

// ===== Call the Gemini API =====
async function askGemini() {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: "You are NefTalk, a friendly and helpful chatbot. Keep answers clear and fairly short." }]
            },
            contents: history
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error ? data.error.message : "Request failed (" + response.status + ")");
    }

    // The answer lives here in the JSON
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content
        ? data.candidates[0].content.parts
        : null;

    if (!parts) {
        throw new Error("The model sent no answer. Try rephrasing.");
    }

    return parts.map(function (part) { return part.text || ""; }).join("");
}

// ===== Helpers that build the bubbles =====
function addMessage(who, text) {
    const row = document.createElement("div");
    row.className = "row " + who;

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = who === "user" ? "You" : "NefTalk";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;            // textContent is safe: it can't run injected HTML

    row.appendChild(label);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();
}

function showTyping() {
    const row = document.createElement("div");
    row.className = "row bot";
    row.innerHTML = `
        <span class="label">NefTalk</span>
        <div class="typing" aria-label="NefTalk is typing"><span></span><span></span><span></span></div>
    `;
    messages.appendChild(row);
    scrollToBottom();
    return row;
}

function setBusy(isBusy) {
    input.disabled = isBusy;
    sendBtn.disabled = isBusy;
}

function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
}