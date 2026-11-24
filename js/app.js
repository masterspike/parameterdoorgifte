const FORBIDDEN_EMAIL = "aik.leemreize@ns.nl";

const params = new URLSearchParams(window.location.search);
const form = document.querySelector("#composer");
const currentUrl = document.querySelector("#current-url");
const cancelBtn = document.querySelector("#cancel-btn");
const fieldsContainer = document.querySelector("#fields-container");
const facetsContainer = document.querySelector("#facets-container");

let parameterKeys = [];

function getAllUrlParameters() {
  const allParams = {};
  for (const [key, value] of params.entries()) {
    allParams[key] = value.trim();
  }
  return allParams;
}

function createDynamicFields() {
  const allParams = getAllUrlParameters();
  parameterKeys = Object.keys(allParams);

  fieldsContainer.innerHTML = "";

  for (const key of parameterKeys) {
    const label = document.createElement("label");
    label.innerHTML = `
      ${key.charAt(0).toUpperCase() + key.slice(1)}
      <input name="${key}" type="text" autocomplete="off" />
    `;
    fieldsContainer.appendChild(label);
  }

  const inputs = fieldsContainer.querySelectorAll("input");
  inputs.forEach((input) => {
    input.value = allParams[input.name] || "";
  });
}

function createDynamicFacets() {
  const allParams = getAllUrlParameters();

  facetsContainer.innerHTML = "";
  facetsContainer.style.display = "grid";
  facetsContainer.style.gridTemplateColumns = `repeat(${Math.min(allParams.length, 3)}, minmax(0, 1fr))`;
  facetsContainer.style.gap = "0.75rem";
  facetsContainer.style.margin = "0";

  for (const [key, value] of Object.entries(allParams)) {
    const article = document.createElement("article");
    article.className = "facet";
    article.setAttribute("data-key", key);
    article.innerHTML = `
      <h2>${key.charAt(0).toUpperCase() + key.slice(1)}</h2>
      <p class="value" data-value="${key}">${value || "—"}</p>
    `;
    facetsContainer.appendChild(article);
  }
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
    console.log(
      `📤 [${new Date().toISOString()}] Sending postMessage (${severity.toUpperCase()}):`
    );
    console.log(JSON.stringify(messagePayload, null, 2));
    
    window.parent.postMessage(messagePayload, "*");
    console.log(`✅ postMessage successfully sent to parent window`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send postMessage to parent:", error);
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
  const inputs = fieldsContainer.querySelectorAll("input");
  inputs.forEach((input) => {
    const value = input.value.trim();
    collected[input.name] = value || "";
  });
  return collected;
}

function render() {
  currentUrl.textContent = window.location.href;
}

createDynamicFacets();
createDynamicFields();
render();

const initialParams = getAllUrlParameters();

if (Object.values(initialParams).some((v) => v)) {
  const details = Object.entries(initialParams)
    .filter(([_, v]) => v)
    .map(([k, v]) => ({
      message: `${k}: ${v}`,
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

  const allParams = collectParameters();
  const email = allParams.email || "";
  const emailValidation = validateEmail(email);

  if (email && !emailValidation.valid) {
    sendToParent("ERROR", emailValidation.error, [
      {
        message: `E-mail adres: ${email}`,
        severity: "ERROR",
      },
    ]);
    return;
  }

  const details = Object.entries(allParams)
    .filter(([_, v]) => v)
    .map(([k, v]) => ({
      message: `${k}: ${v}`,
      severity: "SUCCESS",
    }));
  sendToParent("SUCCESS", "Gegevens succesvol opgeslagen", details);

  setTimeout(() => {
    form.reset();
    createDynamicFields();
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
    createDynamicFields();
  }, 1500);
});
