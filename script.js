// Final messages in physical grid order: left to right, then top to bottom.
const pills = [
  { id: 1, message: "I hadn’t told them about you, but they saw you dancing in my eyes. I hadn’t told them about you, but they heard you in my speak. The perfume of love cannot be concealed." },
  { id: 2, message: "I dreamed of you before I ever met you, and when I finally did, it was as if I had known you all my life." },
  { id: 3, message: "I looked into the stars and found you. I looked into your eyes and found myself." },
  { id: 4, message: "I love talking to you, even though I have nothing to say." },
  { id: 5, message: "My lover asks me: ‘What is the difference between me and the sky?’ The difference, my love, is that when you laugh, I forget about the sky." },
  { id: 6, message: "You have this quiet way of making the world feel softer." },
  { id: 7, message: "Your soul and my soul are very, very old friends." },
  { id: 8, message: "I’ve started seeing you in everything my eyes lay sight on, whether it is the sun, the moon, or simply a random smile." },
  { id: 9, message: "I will always lean my heart as close to your soul as I can." },
  { id: 10, message: "And when you’re away, I look for you in the flowers, the sunset, and the sea." },
  { id: 11, message: "You came into my life so quietly, and somehow changed the sound of everything." },
  { id: 12, message: "What colour are her eyes? I don’t know. Every time I look into her eyes, I lose my memory." },
];

const STORAGE_KEYS = {
  consumed: "heartBlisterConsumed",
  viewedMessages: "heartBlisterViewedMessages",
};
const MODAL_FADE_MS = 480;
const TABLET_CONSUME_PAUSE_MS = 150;
const validIds = new Set(pills.map(({ id }) => id));

function readIds(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(stored) ? stored.filter((id) => validIds.has(id)) : []);
  } catch {
    return new Set();
  }
}

function saveIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    // The current page still works if storage is blocked by the browser.
  }
}

const state = {
  consumed: readIds(STORAGE_KEYS.consumed),
  viewedMessages: readIds(STORAGE_KEYS.viewedMessages),
};

const grid = document.querySelector("#pill-grid");
const scene = document.querySelector(".scene");
const overlay = document.querySelector("#message-overlay");
const messageText = document.querySelector("#message-text");
const closeButton = document.querySelector("#message-close");
const resetButton = document.querySelector("#reset");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const pillElements = new Map();
let activePillId = null;

const heartSvg = `
  <svg class="tablet__heart" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path class="tablet__heart-lip" d="M16 27.2 5.7 17.1a7.1 7.1 0 0 1 10.3-9.8 7.1 7.1 0 0 1 10.3 9.8Z" />
    <path class="tablet__heart-cut" d="M16 27.2 5.7 17.1a7.1 7.1 0 0 1 10.3-9.8 7.1 7.1 0 0 1 10.3 9.8Z" />
  </svg>
`;

function openMessage(pill) {
  if (activePillId !== null || state.consumed.has(pill.id)) return;

  activePillId = pill.id;
  state.viewedMessages.add(pill.id);
  saveIds(STORAGE_KEYS.viewedMessages, state.viewedMessages);

  messageText.textContent = pill.message;
  overlay.hidden = false;
  scene.inert = true;
  resetButton.inert = true;
  // Separate the hidden and visible styles so the fade always starts.
  void overlay.offsetWidth;
  overlay.classList.add("is-open");
  closeButton.focus({ preventScroll: true });
}

function closeMessage() {
  if (overlay.hidden || !overlay.classList.contains("is-open")) return;

  overlay.classList.remove("is-open");
  const pillId = activePillId;

  const afterFade = () => {
    overlay.hidden = true;
    window.setTimeout(() => {
      if (pillId !== null) consumePill(pillId);
      activePillId = null;
      scene.inert = false;
      resetButton.inert = false;
      focusNextTablet(pillId);
    }, reducedMotion.matches ? 0 : TABLET_CONSUME_PAUSE_MS);
  };

  if (reducedMotion.matches) afterFade();
  else window.setTimeout(afterFade, MODAL_FADE_MS);
}

function consumePill(pillId) {
  if (state.consumed.has(pillId)) return;
  const { cavity, tabletButton } = pillElements.get(pillId);

  state.consumed.add(pillId);
  saveIds(STORAGE_KEYS.consumed, state.consumed);
  cavity.classList.add("consumed");
  cavity.setAttribute("role", "img");
  cavity.setAttribute("aria-label", `Used position ${pillId}`);
  tabletButton.disabled = true;
  tabletButton.setAttribute("aria-hidden", "true");
}

function focusNextTablet(consumedId) {
  const next = pills.find(({ id }) => id > consumedId && !state.consumed.has(id))
    || pills.find(({ id }) => !state.consumed.has(id));
  const target = next ? pillElements.get(next.id).tabletButton : resetButton;
  target.focus({ preventScroll: true });
}

function renderPills() {
  const fragment = document.createDocumentFragment();
  pillElements.clear();

  for (const pill of pills) {
    const cavity = document.createElement("div");
    cavity.className = "cavity";

    const tabletButton = document.createElement("button");
    tabletButton.className = "tablet";
    tabletButton.type = "button";
    tabletButton.setAttribute("aria-label", `Open message ${pill.id}`);
    tabletButton.innerHTML = heartSvg;
    tabletButton.addEventListener("click", () => openMessage(pill));

    cavity.append(tabletButton);
    pillElements.set(pill.id, { cavity, tabletButton });
    if (state.consumed.has(pill.id)) {
      cavity.classList.add("consumed");
      cavity.setAttribute("role", "img");
      cavity.setAttribute("aria-label", `Used position ${pill.id}`);
      tabletButton.disabled = true;
      tabletButton.setAttribute("aria-hidden", "true");
    }
    fragment.append(cavity);
  }

  grid.replaceChildren(fragment);
}

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeMessage();
});
closeButton.addEventListener("click", closeMessage);
document.addEventListener("keydown", (event) => {
  if (overlay.hidden) return;
  if (event.key === "Escape") {
    closeMessage();
  } else if (event.key === "Tab") {
    event.preventDefault();
    closeButton.focus({ preventScroll: true });
  }
});

resetButton.addEventListener("click", () => {
  if (activePillId !== null) return;
  state.consumed.clear();
  state.viewedMessages.clear();
  saveIds(STORAGE_KEYS.consumed, state.consumed);
  saveIds(STORAGE_KEYS.viewedMessages, state.viewedMessages);
  renderPills();
});

renderPills();
