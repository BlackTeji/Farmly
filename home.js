// =========================
// FARM FACTS & BRAND INSIGHTS
// =========================
const agriNutriFacts = [
    "Yam is Nigeria’s most cultivated tuber crop and rich in fiber and antioxidants.",
    "Cassava provides carbohydrates and resistant starch to support gut health.",
    "Plantains are packed with vitamin C, potassium, and dietary fiber.",
    "Sweet potatoes support eye health and digestive wellness.",
    "Okra improves digestion, boosts immunity, and is rich in vitamins A and C.",
    "Spinach contains iron and folate, supporting blood health and energy.",
    "Tomatoes are a source of lycopene, which may reduce the risk of heart disease.",
    "Peppers are high in vitamin A and antioxidants for vision and immune support.",
    "Beans are protein-rich legumes that also aid in healthy digestion.",
    "Groundnuts (peanuts) provide protein and healthy fats for sustained energy."
];

const brandInsights = [
    "Receive fresh, chemical-free produce delivered to Lagos twice a month. Order before Thursday cutoff for on-time delivery.",
    "We offer a standard delivery option to ensure your produce arrives fresh and on time, at the cost of 1500 NGN per delivery.",
    "We empower Delta State farmers by offering fair pricing and pre-order access to their fresh harvests.",
    "All our farm produce is grown naturally, without synthetic chemicals, ensuring the freshest and healthiest options.",
    "Farmly connects urban cities with Delta farms, bringing fresh, natural produce straight to your door while supporting local farmers.",
    "Curate your order exactly the way you want; choose the quantity and types of fresh produce you need."
];

// =========================
// ROTATION LOGIC
// =========================
let agriIndex = 0;
let brandIndex = 0;
let autoRotateInterval;

function updateFact(elementId, text, dotContainerSelector, index, total) {
    const el = document.getElementById(elementId);
    const dots = document.querySelectorAll(`${dotContainerSelector} .dot`);

    if (!el) return;

    el.style.opacity = 0;

    setTimeout(() => {
        el.textContent = text;
        el.style.opacity = 1;

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === (index % total));
        });
    }, 300);
}

function rotateFacts() {
    updateFact(
        "agri-nutri-fact",
        agriNutriFacts[agriIndex % agriNutriFacts.length],
        ".fact-carousel .carousel-dots",
        agriIndex,
        agriNutriFacts.length
    );
    updateFact(
        "brand-fact",
        brandInsights[brandIndex % brandInsights.length],
        ".brand-carousel .carousel-dots",
        brandIndex,
        brandInsights.length
    );
    agriIndex++;
    brandIndex++;
}

function startAutoRotate() {
    autoRotateInterval = setInterval(rotateFacts, 8000);
}

function resetAutoRotate() {
    clearInterval(autoRotateInterval);
    startAutoRotate();
}

// =========================
// SWIPE HANDLING
// =========================
function enableSwipe(elementId, factsArray, indexRef, dotSelector, totalFacts) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let startX = 0;
    let endX = 0;

    el.addEventListener("touchstart", (e) => {
        startX = e.changedTouches[0].screenX;
    });

    el.addEventListener("touchend", (e) => {
        endX = e.changedTouches[0].screenX;
        const diff = startX - endX;

        // Only trigger swipe if movement is significant
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                // Swipe left → next
                if (elementId === "agri-nutri-fact") agriIndex++;
                else brandIndex++;
            } else {
                // Swipe right → previous
                if (elementId === "agri-nutri-fact") agriIndex--;
                else brandIndex--;
            }

            // Wrap around index
            if (elementId === "agri-nutri-fact") {
                if (agriIndex < 0) agriIndex = agriNutriFacts.length - 1;
                updateFact(elementId, agriNutriFacts[agriIndex % agriNutriFacts.length], dotSelector, agriIndex, totalFacts);
            } else {
                if (brandIndex < 0) brandIndex = brandInsights.length - 1;
                updateFact(elementId, brandInsights[brandIndex % brandInsights.length], dotSelector, brandIndex, totalFacts);
            }

            resetAutoRotate();
        }
    });
}

// =========================
// NAVIGATION & MENU
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const navMenu = document.getElementById("nav-menu");

    // Mobile menu toggle
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });

    // Close nav when clicking outside
    document.addEventListener("click", (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            navMenu.classList.remove("show");
        }
    });

    // Prevent default on #
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener("click", (e) => e.preventDefault());
    });

    // Initialize carousels
    rotateFacts();
    startAutoRotate();

    // Enable swipe gestures
    enableSwipe("agri-nutri-fact", agriNutriFacts, "agriIndex", ".fact-carousel .carousel-dots", agriNutriFacts.length);
    enableSwipe("brand-fact", brandInsights, "brandIndex", ".brand-carousel .carousel-dots", brandInsights.length);
});
