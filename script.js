const PRODUCTS_URL = "https://sheetdb.io/api/v1/g1olh3sapi0fv?sheet=Products";
const ORDERS_URL = "https://sheetdb.io/api/v1/g1olh3sapi0fv?sheet=Orders";

let products = [];
const cart = {};

async function fetchProducts() {
  try {
    const res = await fetch(PRODUCTS_URL);
    const data = await res.json();
    products = data.map(p => ({
      id: p.ID,
      name: p.Product,
      price: Number(p.Price),
      unit: p.Unit,
      available: String(p.Available).toLowerCase() === "true",
      image: `img/${p.ID}.jpg`
    }));

    document.querySelector(".start-order").addEventListener("click", () => {
      document.getElementById("checkout-section").scrollIntoView({ behavior: "smooth" });
    });

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
          <button onclick="updateCart('${p.id}', -1)" ${disabled ? "disabled" : ""}>-</button>
          <span id="qty-${p.id}">0</span>
          <button onclick="updateCart('${p.id}', 1)" ${disabled ? "disabled" : ""}>+</button>
        </div>
      </div>`;
  });
}

function updateCart(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
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
      const prod = products.find(p => p.id === id);
      total += qty * prod.price;
      cartContainer.innerHTML += `
        <div class="cart-item">
          <span>${prod.name} x${qty}</span>
          <span>₦${qty * prod.price}</span>
        </div>`;
    }
  }
  totalDisplay.innerText = total;
}

function toggleMenu() {
  document.getElementById("nav-menu").classList.toggle("show");
}
function closeMenu() {
  document.getElementById("nav-menu").classList.remove("show");
}
document.addEventListener("click", e => {
  const menu = document.getElementById("nav-menu");
  const btn = document.querySelector(".menu-btn");
  if (!menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
});

async function checkout() {
  if (Object.values(cart).every(q => q === 0)) {
    return alert("Your cart is empty.");
  }

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const location = document.getElementById("cust-location").value.trim();
  const delivery = document.getElementById("cust-delivery").value;

  if (!name || !phone || !location || !delivery) {
    return alert("Please fill in all customer details.");
  }

  let totalAmount = 0;
  const items = Object.keys(cart)
    .filter(id => cart[id] > 0)
    .map(id => {
      const prod = products.find(p => p.id === id);
      const subtotal = cart[id] * prod.price;
      totalAmount += subtotal;
      return `${prod.name} x${cart[id]} (₦${subtotal})`;
    });

  const summary = items.join("; ");

  try {
    const res = await fetch(ORDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          Name: name,
          Phone: phone,
          Location: location,
          Delivery: delivery,
          Order: summary,
          Total: totalAmount  // ✅ added here
        }]
      })
    });

    console.log("Status:", res.status, [...res.headers]);
    const result = await res.json();
    console.log("Result:", result);

    if (result.created > 0) {
      showModal();
      Object.keys(cart).forEach(id => cart[id] = 0);
      renderProducts();
      renderCart();

      document.getElementById("cust-name").value = "";
      document.getElementById("cust-phone").value = "";
      document.getElementById("cust-location").value = "";
      document.getElementById("cust-delivery").value = "";


    } else {
      alert("❌ Submission failed.");
      console.error("Server result:", result);
    }
  } catch (e) {
    alert("❌ Network error. Try again.");
    console.error("Fetch error:", e);
  }
}

function showModal() {
  document.getElementById("success-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("success-modal").classList.add("hidden");
}


fetchProducts();
