
/* ==========================================
   CAMPUS BAKERY POS
   Products, Cart, Payment, Receipt, Themes
========================================== */

// 1. PRODUCT CATALOG

const products = [
    { id: 1, name: "Pandesal (pack of 5)", price: 25.00, icon: "🥖" },
    { id: 2, name: "Ensaymada", price: 20.00, icon: "🥐" },
    { id: 3, name: "Spanish Bread", price: 15.00, icon: "🥯" },
    { id: 4, name: "Chocolate Cupcake", price: 30.00, icon: "🧁" },
    { id: 5, name: "Loaf Bread", price: 55.00, icon: "🍞" },
    { id: 6, name: "Brewed Coffee (cup)", price: 25.00, icon: "☕" }
];

// 2. TRANSACTION DATA

let cart = [];
let completedTransaction = false;
let transactionCounter = 0;

// 3. HELPER FUNCTIONS

function formatPeso(amount) {
    return "₱" + amount.toFixed(2);
}

function showMessage(message, type = "error") {
    const messageElement = document.getElementById("message");

    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.style.color =
        type === "success" ? "#15803d" : "#b42318";
}

// 4. DISPLAY PRODUCTS

function renderProducts() {
    const productList = document.getElementById("product-list");

    productList.innerHTML = products.map(product => `
        <article class="product-card">
            <div class="product-icon">${product.icon}</div>

            <h3>${product.name}</h3>

            <p class="price">${formatPeso(product.price)}</p>

            <button
                class="add-btn"
                data-product-id="${product.id}"
                type="button"
                ${completedTransaction ? "disabled" : ""}
            >
                + Add to Order
            </button>
        </article>
    `).join("");
}

// 5. CART OPERATIONS

function addToCart(productId) {
    if (completedTransaction) return;

    const product = products.find(item => item.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    renderCart();
    showMessage("");
}

function increaseQuantity(productId) {
    if (completedTransaction) return;

    const item = cart.find(item => item.id === productId);

    if (!item) return;

    item.quantity++;

    renderCart();
    showMessage("");
}

function decreaseQuantity(productId) {
    if (completedTransaction) return;

    const item = cart.find(item => item.id === productId);

    if (!item) return;

    if (item.quantity === 1) {
        removeFromCart(productId);
        return;
    }

    item.quantity--;

    renderCart();
    showMessage("");
}

function removeFromCart(productId) {
    if (completedTransaction) return;

    cart = cart.filter(item => item.id !== productId);

    renderCart();
    showMessage("");
}

// 6. CALCULATE TOTAL

function calculateTotal() {
    return cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
}

// 7. DISPLAY CART

function renderCart() {
    const cartItems = document.getElementById("cart-items");

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <span class="empty-icon">🛒</span>
                <h3>Your cart is empty</h3>
                <p>Select a product to start an order.</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.icon} ${item.name}</strong>

                    <span>${formatPeso(item.price)} each</span>

                    <span class="item-subtotal">
                        Subtotal:
                        ${formatPeso(item.price * item.quantity)}
                    </span>
                </div>

                <div class="cart-controls">
                    <div class="quantity-controls">
                        <button
                            class="quantity-btn"
                            data-action="decrease"
                            data-product-id="${item.id}"
                            type="button"
                            ${completedTransaction ? "disabled" : ""}
                            aria-label="Decrease ${item.name}"
                        >−</button>

                        <span class="quantity">${item.quantity}</span>

                        <button
                            class="quantity-btn"
                            data-action="increase"
                            data-product-id="${item.id}"
                            type="button"
                            ${completedTransaction ? "disabled" : ""}
                            aria-label="Increase ${item.name}"
                        >+</button>
                    </div>

                    <button
                        class="remove-btn"
                        data-action="remove"
                        data-product-id="${item.id}"
                        type="button"
                        ${completedTransaction ? "disabled" : ""}
                    >
                        Remove
                    </button>
                </div>
            </div>
        `).join("");
    }

    document.getElementById("total").textContent =
        formatPeso(calculateTotal());
}

// 8. PRODUCT AND CART BUTTONS

document.getElementById("product-list").addEventListener("click", event => {
    const button = event.target.closest("[data-product-id]");

    if (!button || button.disabled) return;

    addToCart(Number(button.dataset.productId));
});

document.getElementById("cart-items").addEventListener("click", event => {
    const button = event.target.closest("[data-action][data-product-id]");

    if (!button || button.disabled) return;

    const id = Number(button.dataset.productId);

    switch (button.dataset.action) {
        case "increase":
            increaseQuantity(id);
            break;

        case "decrease":
            decreaseQuantity(id);
            break;

        case "remove":
            removeFromCart(id);
            break;
    }
});


/* ==========================================
   9. PAYMENT CONFIRMATION MODAL
========================================== */

let pendingPayment = null;

const paymentModal = document.getElementById("payment-modal");

function closePaymentModal() {
    paymentModal.hidden = true;
    pendingPayment = null;
}

document.getElementById("checkout-btn").addEventListener("click", () => {
    if (completedTransaction) {
        showMessage("Start a new transaction first.");
        return;
    }

    if (cart.length === 0) {
        showMessage("Your cart is empty. Please add products first.");
        return;
    }

    const cashInput = document.getElementById("cash");
    const rawCash = cashInput.value.trim();

    if (rawCash === "") {
        showMessage("Please enter the cash amount received.");
        cashInput.focus();
        return;
    }

    const cash = Number(rawCash);

    if (!Number.isFinite(cash) || cash < 0) {
        showMessage("Please enter a valid, non-negative cash amount.");
        cashInput.focus();
        return;
    }

    const total = calculateTotal();

    if (cash < total) {
        showMessage(
            `Insufficient payment. You still need ${formatPeso(total - cash)}.`
        );
        cashInput.focus();
        return;
    }

    const change = Math.round((cash - total) * 100) / 100;

    // Save the details temporarily until the cashier confirms.
    pendingPayment = {
        cash,
        total,
        change
    };

    // Fill the confirmation modal.
    document.getElementById("confirm-total").textContent =
        formatPeso(total);

    document.getElementById("confirm-cash").textContent =
        formatPeso(cash);

    document.getElementById("confirm-change").textContent =
        formatPeso(change);

    showMessage("");

    // Display the custom confirmation modal.
    paymentModal.hidden = false;

    document.getElementById("proceed-payment").focus();
});

// Cancel: return to the order without completing payment.
document.getElementById("cancel-payment").addEventListener("click", () => {
    closePaymentModal();
    showMessage("Payment cancelled. You can review your order.");
    document.getElementById("checkout-btn").focus();
});

// Proceed: complete payment and generate the receipt.
document.getElementById("proceed-payment").addEventListener("click", () => {
    if (!pendingPayment || completedTransaction) {
        closePaymentModal();
        return;
    }

    // Recheck that the order has not changed.
    if (
        cart.length === 0 ||
        Math.abs(calculateTotal() - pendingPayment.total) > 0.001
    ) {
        closePaymentModal();
        showMessage("The order changed. Please review the payment again.");
        return;
    }

    const { cash, total, change } = pendingPayment;

    transactionCounter++;

    const reference =
        "CB-" +
        Date.now().toString().slice(-8) +
        "-" +
        String(transactionCounter).padStart(3, "0");

    const transaction = {
        reference,
        date: new Date().toLocaleString(),
        items: cart.map(item => ({ ...item })),
        total,
        cash,
        change
    };

    completedTransaction = true;
    closePaymentModal();

    renderProducts();
    renderCart();
    generateReceipt(transaction);

    showMessage(
        `Payment successful! Change: ${formatPeso(change)}.`,
        "success"
    );

    document.getElementById("cash").disabled = true;
    document.getElementById("checkout-btn").disabled = true;
});

// Clicking the dark background closes the modal.
paymentModal.addEventListener("click", event => {
    if (event.target === paymentModal) {
        closePaymentModal();
        showMessage("Payment cancelled. You can review your order.");
    }
});

// Escape key closes the modal without completing payment.
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !paymentModal.hidden) {
        closePaymentModal();
        showMessage("Payment cancelled. You can review your order.");
    }
});


// 10. GENERATE RECEIPT
// Hides "No Receipt Yet" when payment succeeds.

function generateReceipt(transaction) {
    const receiptSection = document.getElementById("receipt-section");
    const receipt = document.getElementById("receipt");
    const placeholder = document.getElementById("receipt-placeholder");

    const receiptItems = transaction.items.map(item => `
        <div class="receipt-item">
            <div>${item.name} × ${item.quantity}</div>
            <div>${formatPeso(item.price * item.quantity)}</div>
        </div>
    `).join("");

    receipt.innerHTML = `
        <div class="receipt-header">
            <h2>Campus Bakery</h2>
            <p>Official Transaction Receipt</p>
            <p>Reference: ${transaction.reference}</p>
            <p>Date: ${transaction.date}</p>
        </div>

        <hr>

        <div class="receipt-items">
            ${receiptItems}
        </div>

        <hr>

        <div class="receipt-total">
            <p>
                Total:
                <strong>${formatPeso(transaction.total)}</strong>
            </p>

            <p>
                Cash received:
                ${formatPeso(transaction.cash)}
            </p>

            <p>
                Change:
                <strong>${formatPeso(transaction.change)}</strong>
            </p>
        </div>

        <hr>

        <p class="receipt-thanks">
            Thank you for your purchase!
        </p>
    `;

    // Show the receipt.
    receiptSection.hidden = false;

    // Hide the "No Receipt Yet" placeholder.
    placeholder.hidden = true;
}

// 11. PRINT RECEIPT

document.getElementById("print-btn").addEventListener("click", () => {
    if (!completedTransaction) return;

    window.print();
});

// 12. START A NEW TRANSACTION

document.getElementById("new-transaction-btn").addEventListener("click", () => {
    cart = [];
    completedTransaction = false;

    // Reset payment input.
    const cashInput = document.getElementById("cash");

    cashInput.value = "";
    cashInput.disabled = false;

    document.getElementById("checkout-btn").disabled = false;

    // Clear the previous receipt.
    document.getElementById("receipt").innerHTML = "";

    // Hide the receipt panel.
    document.getElementById("receipt-section").hidden = true;

    // Show the placeholder again for the next transaction.
    document.getElementById("receipt-placeholder").hidden = false;

    showMessage("");

    renderProducts();
    renderCart();
});

// 13. DARK MODE / LIGHT MODE

const themeToggle = document.getElementById("theme-toggle");

function setTheme(theme) {
    document.body.dataset.theme = theme;

    if (themeToggle) {
        themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";

        themeToggle.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        themeToggle.title =
            theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode";
    }
}

if (themeToggle) {
    setTheme("light");

    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.body.dataset.theme === "dark" ? "dark" : "light";

        setTheme(currentTheme === "light" ? "dark" : "light");
    });
}

// 14. INITIAL DISPLAY

renderProducts();
renderCart();
