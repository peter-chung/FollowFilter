const DEFAULT_STATE = { blacklist: [], enabled: true };

const REMOVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

function updateToggleLabel(enabled) {
  const label = document.getElementById("toggle-label");
  label.textContent = enabled ? "On" : "Off";
  label.className = enabled ? "toggle-label" : "toggle-label off";
}

function renderChips(blacklist) {
  const list = document.getElementById("chip-list");
  const sectionLabel = document.querySelector(".section-label");

  sectionLabel.textContent =
    blacklist.length > 0
      ? `Hidden Categories (${blacklist.length})`
      : "Hidden Categories";

  list.innerHTML = "";

  if (blacklist.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <p>No categories hidden yet.</p>
        <p>Add one below or hover a category on Twitch.</p>
      </div>`;
    return;
  }

  blacklist.forEach((category) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<span>${category}</span><button class="remove-btn" data-category="${category}" title="Remove">${REMOVE_ICON}</button>`;
    list.appendChild(chip);
  });
}

function flashDuplicate() {
  const input = document.getElementById("category-input");
  input.classList.remove("duplicate");
  void input.offsetWidth; // force reflow to restart animation
  input.classList.add("duplicate");
}

function init() {
  chrome.storage.sync.get(DEFAULT_STATE, ({ blacklist, enabled }) => {
    renderChips(blacklist);
    document.getElementById("enabled-toggle").checked = enabled;
    updateToggleLabel(enabled);
    document.getElementById("category-input").focus();
  });
}

document.getElementById("add-btn").addEventListener("click", () => {
  const input = document.getElementById("category-input");
  const value = input.value.trim();
  if (!value) return;

  chrome.storage.sync.get(DEFAULT_STATE, ({ blacklist, enabled }) => {
    const alreadyExists = blacklist.some(
      (b) => b.toLowerCase() === value.toLowerCase()
    );

    if (alreadyExists) {
      flashDuplicate();
      return;
    }

    const updated = [...blacklist, value];
    chrome.storage.sync.set({ blacklist: updated }, () => {
      renderChips(updated);
      input.value = "";
      input.focus();
    });
  });
});

document.getElementById("category-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("add-btn").click();
});

document.getElementById("chip-list").addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-btn");
  if (!btn) return;

  const category = btn.dataset.category;
  chrome.storage.sync.get(DEFAULT_STATE, ({ blacklist, enabled }) => {
    const updated = blacklist.filter((b) => b !== category);
    chrome.storage.sync.set({ blacklist: updated }, () => renderChips(updated));
  });
});

document.getElementById("enabled-toggle").addEventListener("change", (e) => {
  const enabled = e.target.checked;
  chrome.storage.sync.set({ enabled });
  updateToggleLabel(enabled);
});

init();
