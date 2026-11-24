const KEYS = ["naam", "afdeling", "referentie"];
const FORBIDDEN_EMAIL = "aik.leemreize@ns.nl";

const params = new URLSearchParams(window.location.search);
const form = document.querySelector("#composer");
const currentUrl = document.querySelector("#current-url");
const cancelBtn = document.querySelector("#cancel-btn");

function readValue(key) {
  return (params.get(key) ?? "").trim();
}

function sendToParent(severity, mainMessage, detailsArray = []) {
  const messagePayload = {
    operation: "showMessage",
    params: {
      message: mainMessage,
      severity: severity.toUpperCase(),
      details: detailsArray,
    },
  };

  try {
    window.parent.postMessage(messagePayload, "*");
    console.log(`[${severity}] Notification sent to parent:`, messagePayload);
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
  const details = KEYS
    .filter((k) => initialParams[k])
    .map((k) => ({
      message: `${k}: ${initialParams[k]}`,
      severity: "INFO",
    }));
  sendToParent("INFO", "Parameters geladen vanuit URL", details);
}

form.addEventListener("input", () => {
  const params = collectParameters();
  const anyFilled = Object.values(params).some((v) => v);
  if (anyFilled) {
    const details = Object.entries(params)
      .filter(([_, v]) => v)
      .map(([k, v]) => ({
        message: `${k}: ${v}`,
        severity: "INFO",
      }));
    sendToParent("INFO", "Invoer gedetecteerd", details);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = form.elements["email"].value.trim();
  const emailValidation = validateEmail(email);

  if (!emailValidation.valid) {
    sendToParent("ERROR", emailValidation.error, [
      {
        message: `E-mail adres: ${email}`,
        severity: "ERROR",
      },
    ]);
    return;
  }

  const params = collectParameters();
  const details = Object.entries(params)
    .filter(([_, v]) => v)
    .map(([k, v]) => ({
      message: `${k}: ${v}`,
      severity: "SUCCESS",
    }));
  sendToParent("SUCCESS", "Gegevens succesvol opgeslagen", details);

  setTimeout(() => {
    form.reset();
    render();
  }, 1500);
});

cancelBtn.addEventListener("click", () => {
  const params = collectParameters();
  const details = Object.entries(params)
    .filter(([_, v]) => v)
    .map(([k, v]) => ({
      message: `${k}: ${v}`,
      severity: "WARNING",
    }));
  sendToParent("WARNING", "Bewerking geannuleerd door gebruiker", details);

  setTimeout(() => {
    form.reset();
    render();
  }, 1500);
});
