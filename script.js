const PRODUCTS_URL = "https://sheetdb.io/api/v1/ps7igjn24dxxe?sheet=Products";
const ORDERS_URL = "https://sheetdb.io/api/v1/ps7igjn24dxxe?sheet=Orders";

let products = [];
const cart = {};

const deliveryCycles = [
  { cutoff: "2025-07-25", start: "2025-07-28", end: "2025-07-31", batch: "2025-07" },
  { cutoff: "2025-08-12", start: "2025-08-15", end: "2025-08-18", batch: "2025-08" }
];

// Fetch products
async function fetchProducts() {
  try {
    const container = document.getElementById("product-list");
    container.innerHTML = "<p>⏳ Loading products...</p>";

    const res = await fetch(PRODUCTS_URL);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("Invalid data format");

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
    document.getElementById("product-list").innerHTML = "<p>⚠️ Unable to load products.</p>";
  }
}

// Render products
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

// Cart updates
function updateCart(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  document.getElementById(`qty-${id}`).innerText = cart[id];
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  const subtotalDisplay = document.getElementById("cart-subtotal");
  const deliveryFeeDisplay = document.getElementById("cart-delivery-fee");
  const totalDisplay = document.getElementById("cart-total");

  cartContainer.innerHTML = "";
  let subtotal = 0;

  for (const id in cart) {
    const qty = cart[id];
    if (qty > 0) {
      const prod = products.find(p => p.id === id);
      const itemTotal = qty * prod.price;
      subtotal += itemTotal;
      cartContainer.innerHTML += `
        <div class="cart-item">
          <span>${prod.name} x${qty}</span>
          <span>₦${itemTotal.toLocaleString()}</span>
        </div>`;
    }
  }

  const deliveryType = document.getElementById("cust-delivery")?.value || "";
  let deliveryFee = 0;
  if (deliveryType.toLowerCase().includes("standard")) {
    deliveryFee = 5000;
  } else if (deliveryType.toLowerCase().includes("express")) {
    deliveryFee = 8000;
  }

  subtotalDisplay.innerText = `₦${subtotal.toLocaleString()}`;
  deliveryFeeDisplay.innerText = `₦${deliveryFee.toLocaleString()}`;
  totalDisplay.innerText = `₦${(subtotal + deliveryFee).toLocaleString()}`;
}

// Delivery cycle logic
function getCurrentCycle() {
  const today = new Date();
  for (let i = 0; i < deliveryCycles.length; i++) {
    const cutoffDate = new Date(deliveryCycles[i].cutoff);
    if (today <= cutoffDate) return { cycle: deliveryCycles[i], nextIndex: i };
  }
  return { cycle: deliveryCycles[deliveryCycles.length - 1], nextIndex: deliveryCycles.length - 1 };
}

function updateDeliveryInfo() {
  const { cycle, nextIndex } = getCurrentCycle();
  const today = new Date();
  const cutoff = new Date(cycle.cutoff);
  const messageEl = document.getElementById("delivery-message");
  const timerEl = document.getElementById("countdown-timer");

  if (today <= cutoff) {
    messageEl.textContent = `Place your order before ${cycle.cutoff} to enjoy fresh farm produce delivered starting ${cycle.start}.`;
  } else {
    const nextCycle = deliveryCycles[nextIndex + 1] || cycle;
    messageEl.textContent = `⏳ We're preparing for the next batch! Orders now will be delivered from ${nextCycle.start}. Thank you for your patience.`;
  }


  function countdown() {
    const now = new Date();
    const diff = cutoff - now;
    if (diff <= 0) {
      timerEl.textContent = "Order Cut-off passed! Next cycle starts soon.";
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    timerEl.textContent = `Next Order Cut-off in ${days} days ${hours} hours.`;
  }

  countdown();
  setInterval(countdown, 1000);
}

// Paystack
function payWithPaystack() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const location = document.getElementById("cust-location").value.trim();
  const delivery = document.getElementById("cust-delivery").value;
  const email = document.getElementById("cust-email").value.trim() || "customer@example.com";

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

  if (totalAmount === 0) {
    return alert("Your cart is empty.");
  }

  let deliveryFee = 0;
  if (delivery.toLowerCase().includes("standard")) {
    deliveryFee = 2500;
  } else if (delivery.toLowerCase().includes("express")) {
    deliveryFee = 5000;
  }

  const totalPayable = totalAmount + deliveryFee;
  const summary = items.join("; ");
  const batchInfo = getCurrentCycle().cycle;

  const handler = PaystackPop.setup({
    key: "pk_test_93fb0a0817cffc7772f7084f3c388fda026c98f9",
    email: email,
    amount: totalPayable * 100,
    currency: "NGN",
    ref: "FARM" + Math.floor(Math.random() * 1000000000),
    metadata: {
      custom_fields: [
        { display_name: "Full Name", variable_name: "full_name", value: name },
        { display_name: "Phone Number", variable_name: "phone", value: phone },
        { display_name: "Delivery Location", variable_name: "location", value: location },
        { display_name: "Delivery Type", variable_name: "delivery", value: delivery },
        { display_name: "Order Summary", variable_name: "order_summary", value: summary }
      ]
    },
    callback: function (response) {
      fetch(ORDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{
            Name: name,
            Phone: phone,
            Location: location,
            Delivery: delivery,
            Order: summary,
            Total: totalAmount,
            BatchID: batchInfo.batch,
            DeliveryRange: `${batchInfo.start} - ${batchInfo.end}`,
            Reference: response.reference,
            Email: email
          }]
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.created > 0) {
            showModal();

            // Reset cart quantities and UI
            Object.keys(cart).forEach(id => {
              cart[id] = 0;
              document.getElementById(`qty-${id}`).innerText = "0";
            });

            // Clear delivery selection and other inputs
            document.getElementById("cust-delivery").value = "";
            document.getElementById("cust-name").value = "";
            document.getElementById("cust-phone").value = "";
            document.getElementById("cust-location").value = "";
            document.getElementById("cust-email").value = "";

            // Re-render cart summary (subtotal, delivery fee, total)
            renderCart();
          } else {
            alert("❌ Payment succeeded, but order not saved.");
            console.error(result);
          }
        })
        .catch(error => {
          alert("⚠️ Payment succeeded, but error saving order.");
          console.error(error);
        });
    },
    onClose: function () {
      alert("❌ Payment window closed.");
    }
  });

  handler.openIframe();
}

// Modal
function showModal() {
  document.getElementById("success-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("success-modal").classList.add("hidden");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  updateDeliveryInfo();

  const deliverySelect = document.getElementById("cust-delivery");
  if (deliverySelect) {
    deliverySelect.addEventListener("change", renderCart);
  }

  const startOrderBtn = document.querySelector(".start-order");
  if (startOrderBtn && document.getElementById("checkout-section")) {
    startOrderBtn.addEventListener("click", () => {
      document.getElementById("checkout-section").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("menu-toggle").addEventListener("click", () => {
      document.getElementById("nav-menu").classList.toggle("show");
    });

    document.addEventListener("click", e => {
      const menu = document.getElementById("nav-menu");
      const btn = document.getElementById("menu-toggle");
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("show");
      }
    });
  }
});
