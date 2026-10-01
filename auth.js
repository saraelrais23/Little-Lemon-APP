const accountStorageKey = "little-lemon-demo-accounts";
const currentUserStorageKey = "little-lemon-current-user";
const themeStorageKey = "little-lemon-theme";
const passwordIterations = 150000;
const encoder = new TextEncoder();
const message = document.querySelector("#auth-message");
const loginTab = document.querySelector("#login-tab");
const signupTab = document.querySelector("#signup-tab");
const loginPanel = document.querySelector("#login-panel");
const signupPanel = document.querySelector("#signup-panel");

function readAccounts() {
    const savedAccounts = localStorage.getItem(accountStorageKey);
    if (!savedAccounts) return [];

    try {
        const accounts = JSON.parse(savedAccounts);
        return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
        console.error("Unable to read demo accounts.", error);
        message.textContent = "Saved account data could not be read. Please clear this site's local data and try again.";
        return [];
    }
}

function applyTheme(theme) {
    const isLight = theme === "light";
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
    const themeButton = document.querySelector("#theme-btn");
    themeButton.classList.toggle("fa-sun", isLight);
    themeButton.classList.toggle("fa-moon", !isLight);
    themeButton.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
}

function showPanel(panelName) {
    const showSignup = panelName === "signup";
    signupPanel.hidden = !showSignup;
    loginPanel.hidden = showSignup;
    signupTab.classList.toggle("active", showSignup);
    loginTab.classList.toggle("active", !showSignup);
    signupTab.setAttribute("aria-selected", String(showSignup));
    loginTab.setAttribute("aria-selected", String(!showSignup));
    message.textContent = "";
}

function toHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt,
        iterations: passwordIterations,
        hash: "SHA-256"
    }, keyMaterial, 256);
    return toHex(new Uint8Array(derivedBits));
}

function setTheme(nextTheme) {
    applyTheme(nextTheme);
    try {
        localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
        console.error("Unable to save theme preference.", error);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(signupPanel);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }

    const accounts = readAccounts();
    if (accounts.some((account) => account.email === email)) {
        message.textContent = "An account with this email already exists in this browser.";
        return;
    }

    try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const account = {
            name,
            email,
            salt: toHex(salt),
            passwordHash: await hashPassword(password, salt),
            iterations: passwordIterations
        };
        localStorage.setItem(accountStorageKey, JSON.stringify([...accounts, account]));
        localStorage.setItem(currentUserStorageKey, JSON.stringify({ name, email }));
        message.textContent = "Your demo account is ready. Taking you back to the restaurant...";
        window.location.assign("index.html");
    } catch (error) {
        console.error("Unable to create demo account.", error);
        message.textContent = "We couldn't create your account in this browser. Please try again.";
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(loginPanel);
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");
    const account = readAccounts().find((savedAccount) => savedAccount.email === email);
    if (!account) {
        message.textContent = "No demo account was found for this email in this browser.";
        return;
    }

    try {
        const salt = Uint8Array.from(account.salt.match(/.{2}/g), (byte) => parseInt(byte, 16));
        const candidateHash = await hashPassword(password, salt);
        if (candidateHash !== account.passwordHash) {
            message.textContent = "The email or password is incorrect.";
            return;
        }
        localStorage.setItem(currentUserStorageKey, JSON.stringify({ name: account.name, email: account.email }));
        message.textContent = "You're signed in. Taking you back to the restaurant...";
        window.location.assign("index.html");
    } catch (error) {
        console.error("Unable to sign in to demo account.", error);
        message.textContent = "We couldn't sign you in. Please try again.";
    }
}

loginTab.addEventListener("click", () => showPanel("login"));
signupTab.addEventListener("click", () => showPanel("signup"));
signupPanel.addEventListener("submit", handleSignup);
loginPanel.addEventListener("submit", handleLogin);
document.querySelector("#theme-btn").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
});

let savedTheme = "dark";
try {
    savedTheme = localStorage.getItem(themeStorageKey) || "dark";
} catch (error) {
    console.error("Unable to read theme preference.", error);
}
applyTheme(savedTheme);
