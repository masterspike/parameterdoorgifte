const KEYS = ["naam", "afdeling", "referentie"];
const PARENT_ORIGIN = "https://my1000354.de1.test.crm.cloud.sap";
const FORBIDDEN_EMAIL = "aik.leemreize@ns.nl";

const params = new URLSearchParams(window.location.search);
const form = document.querySelector("#composer");
const currentUrl = document.querySelector("#current-url");
const cancelBtn = document.querySelector("#cancel-btn");

function readValue(key) {
  return (params.get(key) ?? "").trim();
}

function canPostMessage() {
  return window.parent !== window && window.parent !== null;
}

function sendToParent(notificationType, data, message = "") {
  const messagePayload = {
    type: "parameterdoorgifte:notification",
    timestamp: Date.now(),
    level: notificationType,
    message: message,
    data: data,
    metadata: {
      source: "parameterdoorgifte-iframe",
      version: "1.0",
      url: window.location.href,
    },
  };

  try {
    window.parent.postMessage(messagePayload, PARENT_ORIGIN);
    console.log(`[${notificationType}] Notification sent to parent:`, messagePayload);
    return true;
  } catch (error) {
    console.error("Failed to send postMessage to parent:", error);
    return false;
  }
}

function validateEmail(email) {
  if (!email) return { valid: true, error: null };
  if (email.toLowerCase() === FORBIDDEN_EMAIL.toLowerCase()) {
    return {
      valid: false,
      error: `E-mail adres '${FORBIDDEN_EMAIL}' is niet toegestaan`,
    };
  }
  return { valid: true, error: null };
}

function collectParameters() {
  const collected = {};
  for (const key of KEYS) {
    const value = form.elements[key].value.trim();
    collected[key] = value || "";
  }
  const email = form.elements["email"].value.trim();
  if (email) collected.email = email;
  return collected;
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

render();

const initialParams = Object.fromEntries(
  KEYS.map((k) => [k, readValue(k)])
);

if (Object.values(initialParams).some((v) => v)) {
  sendToParent("INFO", initialParams, "Parameters geladen vanuit URL");
}

form.addEventListener("input", () => {
  const params = collectParameters();
  const anyFilled = Object.values(params).some((v) => v);
  if (anyFilled) {
    sendToParent("INFO", params, "Invoer gedetecteerd");
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = form.elements["email"].value.trim();
  const emailValidation = validateEmail(email);

  if (!emailValidation.valid) {
    sendToParent("ERROR", { email }, emailValidation.error);
    return;
  }

  const params = collectParameters();
  sendToParent("SUCCESS", params, "Gegevens succesvol opgeslagen");
  
  setTimeout(() => {
    form.reset();
    render();
  }, 1500);
});

cancelBtn.addEventListener("click", () => {
  const params = collectParameters();
  sendToParent("WARNING", params, "Bewerking geannuleerd door gebruiker");
  
  setTimeout(() => {
    form.reset();
    render();
  }, 1500);
});
