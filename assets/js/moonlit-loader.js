(function () {
  const app = document.getElementById("moonlit-app");
  const gate = document.querySelector("[data-moonlit-gate]");
  const gateMessage = document.querySelector("[data-gate-message]");
  let topPassword = "";
  let shellPayload = null;
  const demoTokens = new Map([
    ["siggraph", {
      topPassword: "password",
      projectSlug: "siggraph-2026-leads",
      projectPassword: "siggraph2026"
    }]
  ]);

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function deriveKey(secret, salt, iterations) {
    const encoded = new TextEncoder().encode(secret);
    const keyMaterial = await crypto.subtle.importKey("raw", encoded, "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptEnvelope(envelope, secret) {
    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    const tag = base64ToBytes(envelope.tag);
    const ciphertext = base64ToBytes(envelope.ciphertext);
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);
    const key = await deriveKey(secret, salt, envelope.iterations);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined);
    return JSON.parse(new TextDecoder().decode(plaintext));
  }

  async function fetchEncrypted(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to fetch ${url}`);
    return response.json();
  }

  function setGateMessage(message) {
    if (gateMessage) gateMessage.textContent = message;
  }

  function renderLoadingDemo() {
    document.body.classList.add("moonlit-unlocked");
    app.innerHTML = `
      <section class="moonlit-project-view">
        <div class="moonlit-project-toolbar">
          <strong>Opening SIGGRAPH Demo</strong>
        </div>
        <div style="min-height:calc(100vh - 55px);display:grid;place-items:center;background:#050716;color:#dbeafe;font:800 13px/1.4 Inter,system-ui,sans-serif;letter-spacing:0.12em;text-transform:uppercase;">
          Decrypting demo...
        </div>
      </section>
    `;
  }

  function installStyle(id, css) {
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  function renderProjectCards(manifest) {
    const grid = app.querySelector("[data-project-grid]");
    if (!grid) return;
    grid.innerHTML = manifest
      .map((project) => `
        <button class="moonlit-project-card" type="button" data-project-slug="${project.slug}">
          <span>${project.kicker}</span>
          <div>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
          </div>
          <strong>Decrypt Project</strong>
        </button>
      `)
      .join("");
  }

  function renderShell(payload) {
    shellPayload = payload;
    document.body.classList.add("moonlit-unlocked");
    installStyle("moonlit-shell-style", payload.css);
    app.innerHTML = `
      <div class="moonlit-shell">
        <div class="moonlit-shell-frame">
          <header class="moonlit-topbar">
            <div class="moonlit-brand"><span class="moonlit-mark"></span><span>${payload.workspace.name}</span></div>
            <div class="moonlit-pill">Encrypted Shell Online</div>
          </header>
          ${payload.html}
        </div>
      </div>
    `;
    renderProjectCards(payload.manifest);
  }

  function renderProject(project) {
    app.innerHTML = `
      <section class="moonlit-project-view">
        <div class="moonlit-project-toolbar">
          <button type="button" data-back-to-shell>Back to Moonlit Labs</button>
          <strong>${project.title}</strong>
        </div>
        <iframe class="moonlit-project-frame" sandbox="allow-scripts" referrerpolicy="no-referrer" title="${project.title}"></iframe>
      </section>
    `;
    const frame = app.querySelector("iframe");
    frame.srcdoc = project.html;
  }

  async function unlockShell(password) {
    const envelope = await fetchEncrypted("vault/moonlit-shell.enc");
    return decryptEnvelope(envelope, password);
  }

  async function unlockProject(project, projectPassword) {
    const envelope = await fetchEncrypted(`vault/${project.output}`);
    return decryptEnvelope(envelope, `${topPassword}\u001f${projectPassword}`);
  }

  async function openDemoFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (!demo) return false;

    const config = demoTokens.get(demo.toLowerCase());
    if (!config) {
      setGateMessage("Unknown demo token.");
      return false;
    }

    setGateMessage("Opening demo...");
    renderLoadingDemo();
    try {
      topPassword = config.topPassword;
      const shell = await unlockShell(topPassword);
      shellPayload = shell;
      const project = shell.manifest.find((item) => item.slug === config.projectSlug);
      if (!project) throw new Error("Demo project missing from manifest.");
      const payload = await unlockProject(project, config.projectPassword);
      renderProject(payload);
      return true;
    } catch {
      topPassword = "";
      setGateMessage("Unable to open demo token.");
      return false;
    }
  }

  if (gate) {
    gate.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(gate);
      topPassword = String(form.get("password") || "");
      setGateMessage("Decrypting...");
      try {
        const payload = await unlockShell(topPassword);
        renderShell(payload);
      } catch {
        topPassword = "";
        setGateMessage("Unable to decrypt workspace. Check the password.");
      }
    });
  }

  app.addEventListener("click", async (event) => {
    const scrollButton = event.target.closest("[data-scroll-target]");
    if (scrollButton) {
      const target = app.querySelector(scrollButton.getAttribute("data-scroll-target"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const backButton = event.target.closest("[data-back-to-shell]");
    if (backButton && shellPayload) {
      renderShell(shellPayload);
      return;
    }

    const projectButton = event.target.closest("[data-project-slug]");
    if (!projectButton) return;
    const slug = projectButton.getAttribute("data-project-slug");
    const project = shellPayload?.manifest?.find((item) => item.slug === slug);
    if (!project || !project.output) return;
    const projectPassword = window.prompt("Project password:");
    if (!projectPassword) return;

    projectButton.disabled = true;
    projectButton.querySelector("strong").textContent = "Decrypting...";
    try {
      const payload = await unlockProject(project, projectPassword);
      renderProject(payload);
    } catch {
      projectButton.disabled = false;
      projectButton.querySelector("strong").textContent = "Wrong Password";
      window.setTimeout(() => {
        if (projectButton.isConnected) projectButton.querySelector("strong").textContent = "Decrypt Project";
      }, 1600);
    }
  });

  openDemoFromUrl();
})();
