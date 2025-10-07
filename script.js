const PRODUCTS_URL = "https://sheetdb.io/api/v1/ps7igjn24dxxe?sheet=Products";
const ORDERS_URL = "https://sheetdb.io/api/v1/ps7igjn24dxxe?sheet=Orders";

let products = [];
const cart = {};

const STANDARD_DELIVERY_FEE = 5000;
// NOTE: keep true if you want delivery fee waived by default; set false to charge.
let deliveryWaived = true;

function formatDate(dateOrString) {
  if (!dateOrString) return "";
  const date = (dateOrString instanceof Date) ? dateOrString : new Date(dateOrString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Fetch products
async function fetchProducts() {
  const container = document.getElementById("product-list");
  if (!container) return console.warn("No #product-list in DOM");
  container.innerHTML = "<p>⏳ Loading products...</p>";

  try {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error(`Network error: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid data format from products endpoint");

    products = data.map(p => ({
      id: String(p.ID ?? p.id ?? p.Id ?? ""), // tolerant mapping
      name: p.Product ?? p.product ?? p.Name ?? "Unnamed product",
      price: Number(p.Price ?? p.price ?? 0),
      unit: p.Unit ?? p.unit ?? "unit",
      available: String(p.Available ?? p.available ?? "true").toLowerCase() === "true",
      image: `img/${p.ID ?? p.id ?? p.Id ?? 'default'}.jpg`
    })).filter(p => p.id !== "");

    // initialize cart counts for products present
    products.forEach(p => cart[p.id] = cart[p.id] || 0);

    renderProducts();
    renderCart();
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>⚠️ Unable to load products.</p>";
  }
}

// Render products
function renderProducts() {
  const container = document.getElementById("product-list");
  if (!container) return;
  container.innerHTML = "";

  // build markup using a fragment to avoid reflows
  const frag = document.createDocumentFragment();

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.onerror = function () { this.src = 'img/default.jpg'; };

    const h3 = document.createElement("h3");
    h3.textContent = p.name;

    const priceP = document.createElement("p");
    priceP.textContent = `₦${p.price} per ${p.unit}`;

    const availP = document.createElement("p");
    availP.className = p.available ? "text-green-700" : "unavailable";
    availP.textContent = p.available ? "✅ Available" : "❌ Out of stock";

    const controls = document.createElement("div");

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.disabled = !p.available;
    minusBtn.addEventListener("click", () => updateCart(p.id, -1));

    const qtySpan = document.createElement("span");
    qtySpan.id = `qty-${p.id}`;
    qtySpan.textContent = cart[p.id] ?? 0;

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.disabled = !p.available;
    plusBtn.addEventListener("click", () => updateCart(p.id, 1));

    controls.appendChild(minusBtn);
    controls.appendChild(qtySpan);
    controls.appendChild(plusBtn);

    card.appendChild(img);
    card.appendChild(h3);
    card.appendChild(priceP);
    card.appendChild(availP);
    card.appendChild(controls);

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

// Cart updates
function updateCart(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.innerText = cart[id];
  renderCart();
}

function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  const deliveryFeeDisplay = document.getElementById("cart-delivery-fee");
  const totalDisplay = document.getElementById("cart-total");

  if (!cartContainer || !deliveryFeeDisplay || !totalDisplay) {
    console.warn("Cart DOM elements missing");
    return;
  }

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

      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";

      const left = document.createElement("span");
      left.textContent = `${prod.name} x${qty}`;

      const right = document.createElement("span");
      right.textContent = `₦${itemTotal.toLocaleString()}`;

      itemDiv.appendChild(left);
      itemDiv.appendChild(right);
      frag.appendChild(itemDiv);
    }
  }

  cartContainer.appendChild(frag);

  const deliveryFee = deliveryWaived ? 0 : STANDARD_DELIVERY_FEE;
  deliveryFeeDisplay.innerHTML = deliveryWaived
    ? `<s>₦${STANDARD_DELIVERY_FEE.toLocaleString()}</s> (Waived)`
    : `₦${STANDARD_DELIVERY_FEE.toLocaleString()}`;

  totalDisplay.innerText = `₦${(subtotal + deliveryFee).toLocaleString()}`;
}

// Get 2nd & 4th Saturdays (robust across year boundaries)
function getNextDeliveryDates() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  function nthSaturday(year, month, n) {
    // normalize month/year so month is 0-11
    const normalized = new Date(year, month, 1);
    const normYear = normalized.getFullYear();
    const normMonth = normalized.getMonth();

    let date = new Date(normYear, normMonth, 1);
    let count = 0;
    while (date.getMonth() === normMonth) {
      if (date.getDay() === 6) { // Saturday
        count++;
        if (count === n) return new Date(date);
      }
      date.setDate(date.getDate() + 1);
    }
    return null;
  }

  // helper to get month/year for offset (0 => current, 1 => next)
  function monthYearOffset(offset) {
    const d = new Date(currentYear, currentMonth + offset, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  const { y: yCurr, m: mCurr } = monthYearOffset(0);
  const { y: yNext, m: mNext } = monthYearOffset(1);

  let sat2 = nthSaturday(yCurr, mCurr, 2);
  let sat4 = nthSaturday(yCurr, mCurr, 4);

  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  // if null or too close (<= 2 days), roll to next month's corresponding saturday
  if (!sat2 || ((sat2 - today) <= twoDaysMs)) sat2 = nthSaturday(yNext, mNext, 2);
  if (!sat4 || ((sat4 - today) <= twoDaysMs)) sat4 = nthSaturday(yNext, mNext, 4);

  return [sat2, sat4].filter(Boolean);
}

function updateDeliveryBanner() {
  const dates = getNextDeliveryDates();
  const formatted = dates.map(d => d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const banner = document.getElementById("delivery-message");
  if (!banner) return;
  if (formatted.length === 0) {
    banner.innerHTML = `We deliver farm produce to Lagos twice a month.<br><br>No delivery dates available at the moment.`;
  } else {
    banner.innerHTML = `
      We deliver farm produce to Lagos twice a month.<br>
      Order by <strong>midnight on the Thursday before,</strong> for delivery on:<br><br>
      <strong>${formatted.join(" and ")}</strong>
    `;
  }
}

// ----------- MODAL HANDLING -----------
const modal = document.getElementById("deliveryModal");
const modalInfo = document.getElementById("deliveryInfo");
const proceedBtn = document.getElementById("proceedToPayBtn");
const modalClose = document.querySelector(".modal .close");
const payButton = document.getElementById("payButton");

if (payButton) payButton.addEventListener("click", showDeliveryModal);

function showDeliveryModal(e) {
  if (e && typeof e.preventDefault === "function") e.preventDefault();
  const nextDelivery = getNextDeliveryDates()[0];
  const formattedDate = nextDelivery ? nextDelivery.toDateString() : "Next available cycle";

  if (modalInfo) {
    modalInfo.innerHTML = `
      🗓️ <strong>Estimated Delivery:</strong><br>
      <span style="font-size: 1.1em;">${formattedDate}</span><br><br>
      Orders close by <strong>midnight on the Thursday before</strong> delivery.
    `;
  }

  if (modal) modal.style.display = "flex";
}

if (modalClose) modalClose.onclick = () => (modal.style.display = "none");
window.onclick = (e) => { if (modal && e.target === modal) modal.style.display = "none"; };

const cancelModalBtn = document.getElementById("cancelModalBtn");
if (cancelModalBtn) cancelModalBtn.addEventListener("click", () => { if (modal) modal.style.display = "none"; });

if (proceedBtn) proceedBtn.addEventListener("click", () => {
  if (modal) modal.style.display = "none";
  payWithPaystack();
});

// ----------- PAYSTACK FLOW -----------
function payWithPaystack() {
  const nameEl = document.getElementById("cust-name");
  const phoneEl = document.getElementById("cust-phone");
  const locationEl = document.getElementById("cust-location");
  const emailEl = document.getElementById("cust-email");

  const name = nameEl ? nameEl.value.trim() : "";
  const phone = phoneEl ? phoneEl.value.trim() : "";
  const location = locationEl ? locationEl.value.trim() : "";
  const email = (emailEl ? emailEl.value.trim() : "") || "customer@example.com";

  if (!name || !phone || !location) return alert("Please fill in all customer details.");

  let totalAmount = 0;
  const items = Object.keys(cart)
    .filter(id => cart[id] > 0)
    .map(id => {
      const prod = products.find(p => p.id === id);
      const subtotal = prod ? (cart[id] * prod.price) : 0;
      totalAmount += subtotal;
      return { name: prod ? prod.name : "Unknown", price: prod ? prod.price : 0, quantity: cart[id], subtotal };
    });

  if (totalAmount === 0) return alert("Your cart is empty.");

  const deliveryFee = deliveryWaived ? 0 : STANDARD_DELIVERY_FEE;
  const totalPayable = totalAmount + deliveryFee;

  const nextDelivery = getNextDeliveryDates()[0];
  const deliveryDate = nextDelivery ? formatDate(nextDelivery) : "";

  // Paystack handler
  const handler = PaystackPop.setup({
    key: "pk_test_93fb0a0817cffc7772f7084f3c388fda026c98f9",
    email: email,
    amount: Math.round(totalPayable * 100), // kobo
    currency: "NGN",
    ref: "FARM" + Math.floor(Math.random() * 1000000000),
    metadata: {
      custom_fields: [
        { display_name: "Full Name", value: name },
        { display_name: "Phone", value: phone },
        { display_name: "Delivery Location", value: location },
        { display_name: "Delivery Type", value: "Standard Delivery" }
      ]
    },
    callback: function (response) {
      // Save order to SheetDB
      const payload = {
        data: [{
          Name: name,
          Phone: phone,
          Location: location,
          Delivery: "Standard Delivery",
          Order: items.map(i => `${i.name} x${i.quantity}`).join("; "),
          Total: totalPayable,
          DeliveryRange: deliveryDate,
          Reference: response.reference,
          Email: email
        }]
      };

      fetch(ORDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(result => {
          // SheetDB v2 returns an array, or { created: 1 } in some cases. Check a few shapes.
          const createdCount = (result && (result.created || result.created_count || (Array.isArray(result) ? result.length : 0))) || 0;
          if (createdCount > 0) {
            const customer = { name, phone, email };
            const totals = { subtotal: totalAmount, total: totalPayable };
            showReceipt(customer, items, totals, response.reference);

            // reset cart and UI
            Object.keys(cart).forEach(id => { cart[id] = 0; const el = document.getElementById(`qty-${id}`); if (el) el.innerText = "0"; });
            [nameEl, phoneEl, locationEl, emailEl].forEach(i => { if (i) i.value = ""; });
            renderCart();
          } else {
            console.warn("Order save response:", result);
            alert("❌ Payment succeeded, but order not saved.");
          }
        })
        .catch(err => {
          console.error("Error saving order:", err);
          alert("⚠️ Payment succeeded, but error saving order.");
        });
    },
    onClose: function () { alert("❌ Payment window closed."); }
  });
  handler.openIframe();
}

// ----------- RECEIPT MODAL (FIXED) -----------

function showReceipt(customer, cartItems, totals, reference) {
  const rName = document.getElementById("receiptName");
  const rSubtotal = document.getElementById("receiptSubtotal");
  const rTotal = document.getElementById("receiptTotal");
  const rRef = document.getElementById("receiptRef");
  const itemsList = document.getElementById("receiptItems");
  const receiptModal = document.getElementById("receiptModal");

  console.log("🧾 Showing receipt:", { customer, cartItems, totals, reference });

  // Fill in receipt content
  if (rName) rName.textContent = customer.name || "Valued Customer";
  if (rSubtotal) rSubtotal.textContent = `₦${totals.subtotal.toLocaleString()}`;
  if (rTotal) rTotal.textContent = `₦${totals.total.toLocaleString()}`;
  if (rRef) rRef.textContent = reference || "N/A";

  // List of items
  if (itemsList) {
    itemsList.innerHTML = "";
    cartItems.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} × ${item.quantity} — ₦${item.subtotal.toLocaleString()}`;
      itemsList.appendChild(li);
    });
  }

  // ✅ Properly show the modal (fixes blank issue)
  if (receiptModal) {
    receiptModal.classList.remove("hidden"); // remove CSS that hides it
    receiptModal.style.display = "flex";     // trigger flex centering
  }

  // Optional: Scroll to top
  window.scrollTo(0, 0);
}

function closeReceiptModal() {
  const receiptModal = document.getElementById("receiptModal");
  if (receiptModal) {
    receiptModal.classList.add("hidden");
    receiptModal.style.display = "none";
  }
}

// ----------- PDF DOWNLOAD -----------

const downloadReceiptBtn = document.getElementById("downloadReceiptBtn");
if (downloadReceiptBtn) {
  downloadReceiptBtn.addEventListener("click", () => {
    const receipt = document.getElementById("receiptContent");
    if (!receipt) return alert("No receipt content found.");

    const opt = {
      margin: 0.5,
      filename: `Farmly-Receipt-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    // ✅ Temporarily hide download and close buttons before export
    const btns = receipt.querySelectorAll("#downloadReceiptBtn, .modal-close-btn");
    btns.forEach(b => b.style.display = "none");

    setTimeout(() => {
      html2pdf().set(opt).from(receipt).save().then(() => {
        // restore buttons after save
        btns.forEach(b => b.style.display = "");
      });
    }, 300);
  });
}

// Success Modal helpers
function showModal() { const el = document.getElementById("success-modal"); if (el) el.classList.remove("hidden"); }
function closeModal() { const el = document.getElementById("success-modal"); if (el) el.classList.add("hidden"); }

// Init
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  updateDeliveryBanner();
  renderCart();

  // menu toggle
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => navMenu.classList.toggle("show"));
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove("show");
      }
    });
  }
});
