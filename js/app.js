const MODEL = "gemini-3.5-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const form = document.getElementById("messageForm");
const input = document.getElementById("txtUserInput");
const messages = document.getElementById("respond");
const sendButton = form.querySelector("button");
const conversation = [];
let isSending = false;

function addMessage(role, text, className = "") {
    const row = document.createElement("div");
    row.className = `row ${role}${className ? ` ${className}` : ""}`;

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = role === "user" ? "You" : "NefTalk";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    row.append(label, bubble);
    messages.append(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
}

function addTypingIndicator() {
    const row = document.createElement("div");
    row.className = "row bot";
    row.setAttribute("aria-label", "NefTalk is typing");

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = "NefTalk";

    const typing = document.createElement("div");
    typing.className = "typing";
    typing.setAttribute("aria-hidden", "true");
    typing.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));

    row.append(label, typing);
    messages.append(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
}

async function getReply() {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": API_KEY
        },
        body: JSON.stringify({ contents: conversation })
    });

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error(`The API returned an unreadable response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
        throw new Error(result.error?.message || `The API request failed (HTTP ${response.status}).`);
    }

    const reply = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();

    if (!reply) {
        throw new Error("NefTalk couldn't generate a reply. Please try a different message.");
    }

    return reply;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();

    if (!text || isSending) {
        return;
    }

    if (API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
        addMessage("bot", "Add your Gemini API key in js/app.js before sending a message.", "error");
        return;
    }

    isSending = true;
    input.disabled = true;
    sendButton.disabled = true;
    addMessage("user", text);
    input.value = "";

    const typingRow = addTypingIndicator();
    conversation.push({ role: "user", parts: [{ text }] });

    try {
        const reply = await getReply();
        conversation.push({ role: "model", parts: [{ text: reply }] });
        addMessage("bot", reply);
    } catch (error) {
        conversation.pop();
        console.error("NefTalk request failed:", error);
        addMessage("bot", `Sorry, I couldn't get a reply. ${error.message}`, "error");
    } finally {
        typingRow.remove();
        isSending = false;
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
    }
});
