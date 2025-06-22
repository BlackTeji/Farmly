const SHEET_URL = "https://script.google.com/macros/s/AKfycbzmvcp-APoPFQCbaJcqoaURh-ZP2tY67GfvQuq1JAN3Zm-9Kib1UAtWxkP0vSnmsdmx/exec";

let products = [];
const cart = {};

async function fetchProducts() {
    try {
        const res = await fetch(SHEET_URL);
        const data = await res.json();

        products = data.map(p => ({
            id: p.ID,
            name: p.Product,
            price: Number(p.Price),
            unit: p.Unit,
            available: String(p.Available).toLowerCase() === "true",
            image: `img/${p.ID}.jpg`
        }));

        products.forEach(p => cart[p.id] = 0);
        renderProducts();
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

function renderProducts() {
    const container = document.getElementById("product-list");
    container.innerHTML = "";
    products.forEach(p => {
        const disabled = !p.available;
        container.innerHTML += `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='img/default.jpg'" />
        <h3>${p.name}</h3>
        <p>₦${p.price} per ${p.unit}</p>
        <p class="${disabled ? 'unavailable' : 'text-green-700'}">
          ${disabled ? '❌ Out of stock' : '✅ Available'}
        </p>
        <div>
          <button onclick="updateCart('${p.id}', -1)" ${disabled ? 'disabled' : ''}>-</button>
          <span id="qty-${p.id}">0</span>
          <button onclick="updateCart('${p.id}', 1)" ${disabled ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
    });
}

function updateCart(id, delta) {
    if (!cart[id]) cart[id] = 0;
    cart[id] = Math.max(0, cart[id] + delta);
    document.getElementById(`qty-${id}`).innerText = cart[id];
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById("cart-items");
    const totalDisplay = document.getElementById("cart-total");
    cartContainer.innerHTML = "";
    let total = 0;
    for (const id in cart) {
        const qty = cart[id];
        if (qty > 0) {
            const product = products.find(p => p.id === id);
            total += qty * product.price;
            cartContainer.innerHTML += `
        <div class="cart-item">
          <span>${product.name} x${qty}</span>
          <span>₦${qty * product.price}</span>
        </div>`;
        }
    }
    totalDisplay.innerText = total;
}

function toggleMenu() {
    const menu = document.getElementById("nav-menu");
    menu.classList.toggle("show");
}

function closeMenu() {
    document.getElementById("nav-menu").classList.remove("show");
}

document.addEventListener("click", function (e) {
    const menu = document.getElementById("nav-menu");
    const button = document.querySelector(".menu-btn");
    if (!menu.contains(e.target) && !button.contains(e.target)) {
        closeMenu();
    }
});

async function checkout() {
    if (Object.values(cart).every(qty => qty === 0)) {
        alert("Your cart is empty.");
        return;
    }

    const name = document.getElementById("cust-name").value.trim();
    const phone = document.getElementById("cust-phone").value.trim();
    const location = document.getElementById("cust-location").value.trim();
    const date = document.getElementById("cust-date").value;

    if (!name || !phone || !location || !date) {
        alert("Please fill in all customer details.");
        return;
    }

    const orderedItems = [];
    for (const id in cart) {
        const qty = cart[id];
        if (qty > 0) {
            const product = products.find(p => p.id === id);
            orderedItems.push({
                id: product.id,
                name: product.name,
                qty,
                price: product.price
            });
        }
    }

    try {
        const response = await fetch(SHEET_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer: { name, phone, location, date },
                cart: orderedItems
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("Order submitted successfully!");
            for (let id in cart) cart[id] = 0;
            renderProducts();
            renderCart();
        } else {
            alert("Submission failed: " + result.error);
            console.error(result);
        }
    } catch (error) {
        alert("Network error. Please try again.");
        console.error("Fetch error:", error);
    }
}



fetchProducts();
