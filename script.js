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

  // Get delivery fee
  const deliveryType = document.getElementById("cust-delivery").value;
  let deliveryFee = 0;
  if (deliveryType.toLowerCase().includes("standard")) {
    deliveryFee = 5000;
  } else if (deliveryType.toLowerCase().includes("express")) {
    deliveryFee = 8000;
  }

  // Update DOM
  subtotalDisplay.innerText = `₦${subtotal.toLocaleString()}`;
  deliveryFeeDisplay.innerText = `₦${deliveryFee.toLocaleString()}`;
  totalDisplay.innerText = (subtotal + deliveryFee).toLocaleString();
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

function showModal() {
  document.getElementById("success-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("success-modal").classList.add("hidden");
}

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

  const summary = items.join("; ");

  const handler = PaystackPop.setup({
    key: "pk_test_93fb0a0817cffc7772f7084f3c388fda026c98f9",
    email: email,
    amount: totalAmount * 100,
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
            Reference: response.reference,
            Email: email
          }]
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.created > 0) {
            showModal();
            Object.keys(cart).forEach(id => cart[id] = 0);
            renderProducts();
            renderCart();
            document.getElementById("cust-name").value = "";
            document.getElementById("cust-phone").value = "";
            document.getElementById("cust-location").value = "";
            document.getElementById("cust-delivery").value = "";
            document.getElementById("cust-email").value = "";
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

fetchProducts();
document.getElementById("cust-delivery").addEventListener("change", renderCart);

