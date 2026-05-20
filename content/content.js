const DEFAULT_STATE = { blacklist: [], enabled: true };

function injectStyles() {
  if (document.getElementById("tf-styles")) return;

  const style = document.createElement("style");
  style.id = "tf-styles";
  style.textContent = `
    .tf-category-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .tf-block-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s, color 0.15s;
      color: #adadb8;
      flex-shrink: 0;
    }

    .tf-block-btn svg {
      width: 13px;
      height: 13px;
    }

    .tf-category-wrapper:hover .tf-block-btn {
      opacity: 1;
      pointer-events: auto;
    }

    .tf-block-btn:hover {
      color: #9147ff;
    }
  `;
  document.head.appendChild(style);
}

function injectHoverButtons() {
  const categoryLinks = document.querySelectorAll(
    '[data-a-target="preview-card-game-link"]',
  );

  categoryLinks.forEach((categoryLink) => {
    if (categoryLink.parentElement?.classList.contains("tf-category-wrapper"))
      return;

    const category = categoryLink.textContent.trim();

    const wrapper = document.createElement("span");
    wrapper.className = "tf-category-wrapper";

    const btn = document.createElement("button");
    btn.className = "tf-block-btn";
    btn.title = `Hide "${category}"`;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      chrome.storage.sync.get(DEFAULT_STATE, ({ blacklist, enabled }) => {
        if (blacklist.some((b) => b.toLowerCase() === category.toLowerCase()))
          return;
        chrome.storage.sync.set({ blacklist: [...blacklist, category] });
      });
    });

    categoryLink.replaceWith(wrapper);
    wrapper.appendChild(categoryLink);
    wrapper.appendChild(btn);
  });
}

function filterCards(blacklist, enabled) {
  const categoryLinks = document.querySelectorAll(
    '[data-a-target="preview-card-game-link"]',
  );

  categoryLinks.forEach((categoryLink) => {
    const category = categoryLink.textContent.trim().toLowerCase();
    const isBlocked =
      enabled && blacklist.some((entry) => entry.toLowerCase() === category);

    const article = categoryLink.closest("article");
    const tower = article?.closest(".tw-tower");
    if (!article || !tower) return;

    let gridItem = article;
    while (gridItem.parentElement !== tower) {
      gridItem = gridItem.parentElement;
    }

    gridItem.style.display = isBlocked ? "none" : "";
  });
}

function filterSidebar(blacklist, enabled) {
  const categoryEls = document.querySelectorAll(".side-nav-card__metadata p");

  categoryEls.forEach((categoryEl) => {
    const category = categoryEl.textContent.trim().toLowerCase();
    const isBlocked =
      enabled && blacklist.some((entry) => entry.toLowerCase() === category);

    const card = categoryEl.closest(".side-nav-card");
    if (!card) return;

    card.style.display = isBlocked ? "none" : "";
  });
}

function runFilter() {
  chrome.storage.sync.get(DEFAULT_STATE, ({ blacklist, enabled }) => {
    filterCards(blacklist, enabled);
    filterSidebar(blacklist, enabled);
    injectHoverButtons();
  });
}

function startObserving() {
  let initialized = false;
  let debounceTimer;

  const observer = new MutationObserver(() => {
    const cards = document.querySelectorAll(
      '[data-a-target="preview-card-game-link"], .side-nav-card__metadata p',
    );

    if (!initialized && cards.length > 0) {
      initialized = true;
      injectStyles();
      runFilter();
      return;
    }

    if (initialized) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runFilter, 300);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.blacklist || changes.enabled)) {
    runFilter();
  }
});

startObserving();
