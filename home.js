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
    "We offer two flexible delivery options: Express and Standard, each at their own costs.",
    "We empower Delta State farmers by offering fair pricing and pre-order access to their fresh harvests.",
    "All our farm produce is grown naturally, without synthetic chemicals, ensuring the freshest and healthiest options.",
    "Farmly connects Lagos residents with Delta farms, bringing fresh, natural produce straight to your door while supporting local farmers.",
    "Curate your order exactly the way you want — choose the quantity and types of fresh produce you need."
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
    updateFact("agri-nutri-fact", agriNutriFacts[agriIndex % agriNutriFacts.length], ".fact-carousel .carousel-dots", agriIndex, agriNutriFacts.length);
    updateFact("brand-fact", brandInsights[brandIndex % brandInsights.length], ".brand-carousel .carousel-dots", brandIndex, brandInsights.length);
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
// NAVIGATION & MENU
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const navMenu = document.getElementById("nav-menu");

    // Mobile menu toggle
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("show");
    });

    // Close nav on outside click
    document.addEventListener("click", (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            navMenu.classList.remove("show");
        }
    });

    // Prevent default anchors
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', e => e.preventDefault());
    });

    // Initial setup
    rotateFacts();
    startAutoRotate();
});
