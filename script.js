const PRODUCTS_URL = "https://sheetdb.io/api/v1/g1olh3sapi0fv?sheet=Products";
const ORDERS_URL = "https://sheetdb.io/api/v1/g1olh3sapi0fv?sheet=Orders";

let products = [];
const cart = {};
const STANDARD_DELIVERY_FEE = 1500;
let deliveryWaived = true; // waived by default

// ---------- Utility ----------
function formatDate(dateOrString) {
  const date = dateOrString instanceof Date ? dateOrString : new Date(dateOrString);
  if (isNaN(date)) return "";
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

// ---------- Product Handling ----------
async function fetchProducts() {
  const container = document.getElementById("product-list");
  if (!container) return;
  container.innerHTML = "<p>⏳ Loading products...</p>";

  try {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error(`Network error: ${res.status}`);
    const data = await res.json();

    products = (Array.isArray(data) ? data : []).map(p => ({
      id: String(p.ID ?? p.id ?? ""),
      name: p.Product ?? p.product ?? "Unnamed Product",
      price: Number(p.Price ?? p.price ?? 0),
      unit: p.Unit ?? p.unit ?? "unit",
      available: String(p.Available ?? p.available ?? "true").toLowerCase() === "true",
      image: `img/${p.ID ?? p.id ?? "default"}.jpg`,
    })).filter(p => p.id);

    products.forEach(p => (cart[p.id] = cart[p.id] || 0));
    renderProducts();
    renderCart();
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>⚠️ Unable to load products.</p>";
  }
}

function renderProducts() {
  const container = document.getElementById("product-list");
  if (!container) return;
  container.innerHTML = "";

  const frag = document.createDocumentFragment();
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" onerror="this.src='img/default.jpg'">
      <h3>${p.name}</h3>
      <p>₦${p.price} per ${p.unit}</p>
      <p class="${p.available ? "text-green-700" : "unavailable"}">
        ${p.available ? "✅ Available" : "❌ Out of stock"}
      </p>
      <div>
        <button ${!p.available ? "disabled" : ""} onclick="updateCart('${p.id}', -1)">-</button>
        <span id="qty-${p.id}">${cart[p.id]}</span>
        <button ${!p.available ? "disabled" : ""} onclick="updateCart('${p.id}', 1)">+</button>
      </div>
    `;
    frag.appendChild(card);
  });
  container.appendChild(frag);
}

// ---------- Cart ----------
function updateCart(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  document.getElementById(`qty-${id}`).innerText = cart[id];
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  const deliveryDisplay = document.getElementById("cart-delivery-fee");
  const totalDisplay = document.getElementById("cart-total");
  if (!cartContainer || !deliveryDisplay || !totalDisplay) return;

  cartContainer.innerHTML = "";
  let subtotal = 0;
  const frag = document.createDocumentFragment();

  for (const id in cart) {
    const qty = cart[id];
    if (qty > 0) {
      const prod = products.find(p => p.id === id);
      if (!prod) continue;
      const itemTotal = qty * prod.price;
      subtotal += itemTotal;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `<span>${prod.name} x${qty}</span><span>₦${itemTotal.toLocaleString()}</span>`;
      frag.appendChild(div);
    }
  }
  cartContainer.appendChild(frag);

  const deliveryFee = deliveryWaived ? 0 : STANDARD_DELIVERY_FEE;
  deliveryDisplay.innerHTML = deliveryWaived
    ? `<div class="waived-fee">
       <s>₦${STANDARD_DELIVERY_FEE.toLocaleString()}</s>
       <span class="waived-note">(Waived)</span>
     </div>`
    : `₦${STANDARD_DELIVERY_FEE.toLocaleString()}`;

  totalDisplay.textContent = `₦${(subtotal + deliveryFee).toLocaleString()}`;
}

// ---------- Delivery Dates ----------
function getNextDeliveryDates() {
  const today = new Date();

  // Helper to find the nth Saturday of a given month
  const nthSaturday = (year, month, n) => {
    const date = new Date(year, month, 1);
    let count = 0;
    while (date.getMonth() === month) {
      if (date.getDay() === 6) count++;
      if (count === n) return new Date(date);
      date.setDate(date.getDate() + 1);
    }
    return null;
  };

  // Get this month's 2nd and 4th Saturdays
  const currentMonthDates = [2, 4].map(n => nthSaturday(today.getFullYear(), today.getMonth(), n));

  // Get next month's 2nd and 4th Saturdays
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthDates = [2, 4].map(n => nthSaturday(nextMonth.getFullYear(), nextMonth.getMonth(), n));

  // Combine and filter only dates that are at least 3 days from now
  const allDates = [...currentMonthDates, ...nextMonthDates].filter(d => d && d - today > 2 * 86400000);

  // Return the next two upcoming dates
  return allDates.slice(0, 2);
}

function updateDeliveryBanner() {
  const banner = document.getElementById("delivery-message");
  if (!banner) return;

  const dates = getNextDeliveryDates().map(d =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  banner.innerHTML = dates.length
    ? `Next Lagos delivery: ${dates.join(" // ")}<br><br>
       Order closes Tuesday midnight before delivery date.`
    : `We deliver farm produce to Lagos twice a month.<br><br>
       No delivery dates available at the moment.`;
}

// ---------- Modal ----------
const modal = document.getElementById("deliveryModal");
const modalInfo = document.getElementById("deliveryInfo");
const proceedBtn = document.getElementById("proceedToPayBtn");
const payButton = document.getElementById("payButton");

if (payButton) payButton.onclick = showDeliveryModal;
if (proceedBtn) proceedBtn.onclick = () => { closeModal(); payWithPaystack(); };
document.querySelectorAll(".modal .close, #cancelModalBtn").forEach(btn => btn.onclick = closeModal);

function showDeliveryModal(e) {
  e?.preventDefault?.();
  const nextDelivery = getNextDeliveryDates()[0];
  if (modalInfo) {
    modalInfo.innerHTML = `
      🗓️ <strong>Estimated Delivery:</strong><br>
      <span style="font-size:1.1em;">${nextDelivery ? nextDelivery.toDateString() : "Next available cycle"}</span><br><br>
      Orders close by <strong>midnight on the Tuesday before</strong> delivery.
    `;
  }
  if (modal) modal.style.display = "flex";
}

function closeModal() {
  if (modal) modal.style.display = "none";
  const receiptModal = document.getElementById("receiptModal");
  if (receiptModal) receiptModal.style.display = "none";
}

// ---------- Payment ----------
function payWithPaystack() {
  const name = document.getElementById("cust-name")?.value.trim() || "";
  const phone = document.getElementById("cust-phone")?.value.trim() || "";
  const location = document.getElementById("cust-location")?.value.trim() || "";
  const email = document.getElementById("cust-email")?.value.trim() || "customer@example.com";
  if (!name || !phone || !location) return alert("Please fill in all customer details.");

  let subtotal = 0;
  const items = Object.keys(cart).filter(id => cart[id] > 0).map(id => {
    const prod = products.find(p => p.id === id);
    const total = prod.price * cart[id];
    subtotal += total;
    return { name: prod.name, price: prod.price, quantity: cart[id], subtotal: total };
  });
  if (!subtotal) return alert("Your cart is empty.");

  const deliveryFee = deliveryWaived ? 0 : STANDARD_DELIVERY_FEE;
  const totalPayable = subtotal + deliveryFee;
  const deliveryDate = formatDate(getNextDeliveryDates()[0]);

  const handler = PaystackPop.setup({
    key: "pk_test_93fb0a0817cffc7772f7084f3c388fda026c98f9",
    email, amount: totalPayable * 100, currency: "NGN",
    ref: "FARM" + Math.floor(Math.random() * 1e9),
    metadata: {
      custom_fields: [
        { display_name: "Full Name", value: name },
        { display_name: "Phone", value: phone },
        { display_name: "Delivery Location", value: location },
        { display_name: "Delivery Type", value: "Standard Delivery" },
      ],
    },
    callback: (response) => saveOrder(name, phone, location, email, deliveryDate, items, subtotal, totalPayable, response.reference),
    onClose: () => alert("❌ Payment window closed."),
  });
  handler.openIframe();
}

function saveOrder(name, phone, location, email, deliveryDate, items, subtotal, totalPayable, reference) {
  const payload = {
    data: [{
      Name: name, Phone: phone, Location: location, Email: email,
      Delivery: "Standard Delivery", DeliveryRange: deliveryDate,
      Order: items.map(i => `${i.name} x${i.quantity}`).join("; "),
      Total: totalPayable, Reference: reference,
    }],
  };

  fetch(ORDERS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(res => {
      if (res.created || res.created_count || Array.isArray(res)) {

        closeModal();

        showReceipt({ name }, items, { subtotal, total: totalPayable }, reference);
        Object.keys(cart).forEach(id => (cart[id] = 0));
        renderProducts(); renderCart();

        document.getElementById("cust-name").value = "";
        document.getElementById("cust-phone").value = "";
        document.getElementById("cust-location").value = "";
        document.getElementById("cust-email").value = "";

      } else alert("❌ Payment succeeded, but order not saved.");
    })
    .catch(err => {
      console.error("Error saving order:", err);
      alert("⚠️ Payment succeeded, but error saving order.");
    });
}

// ---------- Receipt ----------
function showReceipt(customer, items, totals, reference) {
  document.getElementById("receiptName").textContent = customer.name;
  document.getElementById("receiptSubtotal").textContent = `₦${totals.subtotal.toLocaleString()}`;
  document.getElementById("receiptTotal").textContent = `₦${totals.total.toLocaleString()}`;
  document.getElementById("receiptRef").textContent = reference;

  const list = document.getElementById("receiptItems");
  list.innerHTML = "";
  items.forEach(i => {
    const li = document.createElement("li");
    li.textContent = `${i.name} × ${i.quantity} — ₦${i.subtotal.toLocaleString()}`;
    list.appendChild(li);
  });

  const modal = document.getElementById("receiptModal");
  modal.style.display = "flex";
  modal.classList.remove("hidden");
  window.scrollTo(0, 0);
}

// ---------- PDF Download ----------
document.getElementById("downloadReceiptBtn")?.addEventListener("click", () => {
  const receipt = document.getElementById("receiptContent");
  if (!receipt) return alert("No receipt content found.");
  const modal = document.getElementById("receiptModal");
  modal.style.display = "flex";
  receipt.scrollTop = 0;

  const hidden = receipt.querySelectorAll("#downloadReceiptBtn, .modal-close-btn");
  hidden.forEach(b => (b.style.display = "none"));

  setTimeout(() => {
    html2pdf().set({
      margin: 0.3,
      filename: `Farmly-Receipt-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: window.innerWidth < 768 ? 3 : 2, useCORS: true },
      jsPDF: { unit: "in", format: "a5", orientation: "portrait" },
    })
      .from(receipt)
      .save()
      .then(() => {
        hidden.forEach(b => (b.style.display = ""));
        modal.style.display = "none";
      })
      .catch(err => {
        console.error("PDF generation failed:", err);
        alert("⚠️ Could not generate receipt PDF.");
      });
  }, 500);
});

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  updateDeliveryBanner();
  renderCart();
  document.getElementById("delivery-info-box")?.classList.add("fade-in-up");
  document.getElementById("delivery-message")?.classList.add("animate-slide-in");
});

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");

  // Toggle navigation visibility
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });

  // Close nav when clicking outside
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      navMenu.classList.remove("show");
    }
  });
});