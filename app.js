const products = [
    {
        id: "greek-salad",
        name: "Greek salad",
        description: "Crisp lettuce, peppers, olives, and feta with our house lemon dressing.",
        price: 15.99,
        image: "img/cart1.jpg"
    },
    {
        id: "bruschetta",
        name: "Bruschetta",
        description: "Grilled sourdough topped with ripe tomatoes, fresh basil, and olive oil.",
        price: 13.99,
        image: "img/cart2.jpg"
    },
    {
        id: "lemon-pasta",
        name: "Lemon pasta",
        description: "Fresh pasta tossed with lemon, herbs, parmesan, and a touch of cream.",
        price: 10.99,
        image: "img/cart5.jpg"
    },
    {
        id: "mediterranean-bowl",
        name: "Mediterranean bowl",
        description: "Seasonal vegetables, warm grains, and a bright Mediterranean herb sauce.",
        price: 11.99,
        image: "img/cart3.jpg"
    },
    {
        id: "lemon-dessert",
        name: "Lemon dessert",
        description: "A light house-made lemon dessert with a buttery biscuit base.",
        price: 16.99,
        image: "img/cart4.jpg"
    }
];

const storageKeys = {
    cart: "little-lemon-cart",
    reservations: "little-lemon-reservations",
    orders: "little-lemon-orders",
    theme: "little-lemon-theme",
    user: "little-lemon-current-user"
};
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const navbar = document.querySelector(".navbar");
const cartPanel = document.querySelector(".cart-items-container");
const cartList = document.querySelector("#cart-items");
const cartEmptyMessage = document.querySelector("#cart-empty");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-btn");
const checkoutDialog = document.querySelector("#checkout-dialog");
const checkoutSummary = document.querySelector("#checkout-summary");
const detailsDialog = document.querySelector("#details-dialog");

function readStoredValue(key, fallback) {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return fallback;

    try {
        return JSON.parse(storedValue);
    } catch (error) {
        console.error(`Unable to read saved ${key}.`, error);
        return fallback;
    }
}

function saveStoredValue(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Unable to save ${key}.`, error);
        return false;
    }
}

function normalizeCart(value) {
    if (!Array.isArray(value)) return [];
    return value.filter((entry) =>
        entry &&
        products.some((product) => product.id === entry.id) &&
        Number.isInteger(entry.quantity) &&
        entry.quantity > 0
    );
}

let cart = normalizeCart(readStoredValue(storageKeys.cart, []));

function getProduct(productId) {
    return products.find((product) => product.id === productId);
}

function cartSubtotal() {
    return cart.reduce((total, entry) => total + getProduct(entry.id).price * entry.quantity, 0);
}

function renderProducts() {
    const productContainer = document.querySelector("#menu-products");
    productContainer.innerHTML = products.map((product) => `
        <article class="box menu-card">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">${currency.format(product.price)}</div>
            <div class="menu-card-actions">
                <button class="btn details-button" type="button" data-action="details" data-id="${product.id}">View details</button>
                <button class="btn" type="button" data-action="add" data-id="${product.id}">Add to cart</button>
            </div>
        </article>
    `).join("");
}

function renderCart() {
    cartList.innerHTML = cart.map((entry) => {
        const product = getProduct(entry.id);
        return `
            <article class="cart-line">
                <img src="${product.image}" alt="">
                <div class="cart-line-content">
                    <h3>${product.name}</h3>
                    <p>${currency.format(product.price)} each</p>
                    <div class="quantity-controls" aria-label="Quantity for ${product.name}">
                        <button type="button" data-action="decrease" data-id="${product.id}" aria-label="Decrease ${product.name} quantity">−</button>
                        <span>${entry.quantity}</span>
                        <button type="button" data-action="increase" data-id="${product.id}" aria-label="Increase ${product.name} quantity">+</button>
                    </div>
                </div>
                <button class="remove-item" type="button" data-action="remove" data-id="${product.id}" aria-label="Remove ${product.name}">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </article>
        `;
    }).join("");

    const itemCount = cart.reduce((count, entry) => count + entry.quantity, 0);
    const cartButton = document.querySelector("#cart-btn");
    cartButton.setAttribute("aria-label", `Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`);
    cartButton.dataset.count = itemCount;
    cartEmptyMessage.hidden = cart.length > 0;
    cartTotal.textContent = currency.format(cartSubtotal());
    checkoutButton.disabled = cart.length === 0;
    saveStoredValue(storageKeys.cart, cart);
}

function updateCart(productId, action) {
    const entry = cart.find((item) => item.id === productId);
    if (action === "add" && entry) entry.quantity += 1;
    else if (action === "add") cart.push({ id: productId, quantity: 1 });
    else if (action === "remove") cart = cart.filter((item) => item.id !== productId);
    else if (entry && action === "increase") entry.quantity += 1;
    else if (entry && action === "decrease" && entry.quantity > 1) entry.quantity -= 1;
    else if (entry && action === "decrease") cart = cart.filter((item) => item.id !== productId);

    renderCart();
}

function showProductDetails(productId) {
    const product = getProduct(productId);
    if (!product) return;
    document.querySelector("#details-title").textContent = product.name;
    document.querySelector("#details-image").src = product.image;
    document.querySelector("#details-image").alt = product.name;
    document.querySelector("#details-description").textContent = product.description;
    document.querySelector("#details-price").textContent = currency.format(product.price);
    document.querySelector("#details-add").dataset.id = product.id;
    detailsDialog.showModal();
}

function hidePanels() {
    navbar.classList.remove("active");
    cartPanel.classList.remove("active");
}

function applyTheme(theme) {
    const isLight = theme === "light";
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
    const themeButton = document.querySelector("#theme-btn");
    themeButton.classList.toggle("fa-sun", isLight);
    themeButton.classList.toggle("fa-moon", !isLight);
    themeButton.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
}

function renderAccount() {
    const accountLink = document.querySelector("#account-link");
    const signOutButton = document.querySelector("#sign-out-btn");
    const user = readStoredValue(storageKeys.user, null);
    if (user && typeof user.name === "string") {
        accountLink.textContent = `Hi, ${user.name}`;
        accountLink.href = "auth.html";
        signOutButton.hidden = false;
    } else {
        accountLink.textContent = "Sign in";
        accountLink.href = "auth.html";
        signOutButton.hidden = true;
    }
}

let savedTheme = "dark";
try {
    savedTheme = localStorage.getItem(storageKeys.theme) || "dark";
} catch (error) {
    console.error("Unable to read theme preference.", error);
}
applyTheme(savedTheme);
renderAccount();

document.querySelector("#theme-btn").addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    try {
        localStorage.setItem(storageKeys.theme, nextTheme);
    } catch (error) {
        console.error("Unable to save theme preference.", error);
    }
});

document.querySelector("#sign-out-btn").addEventListener("click", () => {
    localStorage.removeItem(storageKeys.user);
    renderAccount();
});

document.querySelector("#menu-btn").addEventListener("click", () => {
    navbar.classList.toggle("active");
    cartPanel.classList.remove("active");
});

document.querySelector("#cart-btn").addEventListener("click", () => {
    cartPanel.classList.toggle("active");
    navbar.classList.remove("active");
});

document.querySelector("#close-cart").addEventListener("click", () => cartPanel.classList.remove("active"));
window.addEventListener("scroll", hidePanels);
document.addEventListener("click", (event) => {
    if (event.target.closest(".navbar a")) hidePanels();
});

document.querySelector("#menu-products").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "details") showProductDetails(button.dataset.id);
    if (button.dataset.action === "add") updateCart(button.dataset.id, "add");
});

cartList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (button) updateCart(button.dataset.id, button.dataset.action);
});

document.querySelector("#details-add").addEventListener("click", (event) => {
    updateCart(event.currentTarget.dataset.id, "add");
    detailsDialog.close();
    cartPanel.classList.add("active");
});
document.querySelector("#close-details").addEventListener("click", () => detailsDialog.close());

checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) return;
    checkoutSummary.innerHTML = `
        <ul>${cart.map((entry) => {
            const product = getProduct(entry.id);
            return `<li>${product.name} × ${entry.quantity}<strong>${currency.format(product.price * entry.quantity)}</strong></li>`;
        }).join("")}</ul>
        <p><span>Total</span><strong>${currency.format(cartSubtotal())}</strong></p>
    `;
    hidePanels();
    document.querySelector("#checkout-message").textContent = "";
    checkoutDialog.showModal();
});
document.querySelector("#close-checkout").addEventListener("click", () => checkoutDialog.close());

document.querySelector("#checkout-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (cart.length === 0) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const order = {
        id: `LL-${Date.now()}`,
        customer: formData.get("name").trim(),
        email: formData.get("email").trim(),
        orderType: formData.get("orderType"),
        items: cart.map((entry) => ({ ...entry })),
        total: cartSubtotal(),
        createdAt: new Date().toISOString()
    };
    const orders = readStoredValue(storageKeys.orders, []);
    if (!saveStoredValue(storageKeys.orders, [...(Array.isArray(orders) ? orders : []), order])) {
        document.querySelector("#checkout-message").textContent =
            "We couldn't save your demo order in this browser. Please try again.";
        return;
    }
    cart = [];
    renderCart();
    form.reset();
    document.querySelector("#checkout-message").textContent = `Thank you, ${order.customer}! Your demo order ${order.id} has been placed.`;
});

const reservationDate = document.querySelector("#reservation-date");
reservationDate.min = new Date().toLocaleDateString("en-CA");

document.querySelector("#reservation-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const date = new Date(`${formData.get("date")}T12:00:00`);
    const time = formData.get("time");
    const closingTime = date.getDay() === 6 ? "23:00" : date.getDay() === 0 ? "21:00" : "22:00";
    if (time < "14:00" || time >= closingTime) {
        form.elements.time.setCustomValidity(`Please choose a time between 2:00 PM and ${closingTime}.`);
        form.elements.time.reportValidity();
        form.elements.time.setCustomValidity("");
        return;
    }

    const reservation = {
        id: `RES-${Date.now()}`,
        name: formData.get("name").trim(),
        email: formData.get("email").trim(),
        date: formData.get("date"),
        time,
        guests: Number(formData.get("guests")),
        createdAt: new Date().toISOString()
    };
    const reservations = readStoredValue(storageKeys.reservations, []);
    if (!saveStoredValue(storageKeys.reservations, [...(Array.isArray(reservations) ? reservations : []), reservation])) {
        document.querySelector("#reservation-message").textContent =
            "We couldn't save your reservation request in this browser. Please try again.";
        return;
    }
    document.querySelector("#reservation-message").textContent =
        `Thanks, ${reservation.name}! Your reservation request for ${reservation.guests} on ${reservation.date} at ${reservation.time} is confirmed.`;
    form.reset();
    reservationDate.min = new Date().toLocaleDateString("en-CA");
});

renderProducts();
renderCart();
