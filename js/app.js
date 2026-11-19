const KEYS = ["naam", "afdeling", "referentie"];

const params = new URLSearchParams(window.location.search);
const form = document.querySelector("#composer");
const currentUrl = document.querySelector("#current-url");

function readValue(key) {
  return (params.get(key) ?? "").trim();
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

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const next = new URLSearchParams();
  for (const key of KEYS) {
    const value = form.elements[key].value.trim();
    if (value) next.set(key, value);
  }

  const query = next.toString();
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.location.assign(url);
});

render();
