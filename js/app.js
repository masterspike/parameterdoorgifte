const KEYS = ["naam", "afdeling", "referentie"];
const PARENT_ORIGIN = "https://my1000354.de1.test.crm.cloud.sap";

const params = new URLSearchParams(window.location.search);
const form = document.querySelector("#composer");
const currentUrl = document.querySelector("#current-url");

function readValue(key) {
  return (params.get(key) ?? "").trim();
}

function canPostMessage() {
  return window.parent !== window && window.parent !== null;
}

function sendToParent(paramData) {
  if (!canPostMessage()) {
    console.warn("No parent frame available for postMessage");
    return false;
  }

  const message = {
    type: "parameterdoorgifte:update",
    timestamp: Date.now(),
    status: "success",
    data: paramData,
    metadata: {
      source: "parameterdoorgifte-iframe",
      version: "1.0",
      url: window.location.href,
    },
  };

  try {
    window.parent.postMessage(message, PARENT_ORIGIN);
    console.log("Message sent to parent:", message);
    return true;
  } catch (error) {
    console.error("Failed to send postMessage to parent:", error);
    handlePostMessageError(error);
    return false;
  }
}

function handlePostMessageError(error) {
  console.error("postMessage error details:", error.message);
}

function showSuccessIndicator() {
  const btn = document.querySelector("button[type='submit']");
  const original = btn.textContent;
  btn.textContent = "✓ Verstuurd naar SAP";
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 2000);
}

function render() {
  for (const key of KEYS) {
    const value = readValue(key);
    const node = document.querySelector(`[data-value="${key}"]`);
    const field = form.elements[key];

    node.textContent = value || "niet meegegeven";
    node.classList.toggle("is-empty", value.length === 0);
    field.value = value;
  }

  currentUrl.textContent = window.location.href;
}

function collectParameters() {
  const collected = {};
  for (const key of KEYS) {
    const value = form.elements[key].value.trim();
    collected[key] = value || "";
  }
  return collected;
}

render();

const initialParams = Object.fromEntries(
  KEYS.map((k) => [k, readValue(k)])
);
sendToParent(initialParams);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const updated = collectParameters();

  const success = sendToParent(updated);
  if (success) {
    showSuccessIndicator();
  }
});
