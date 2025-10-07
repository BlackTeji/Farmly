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
    "Groundnuts (peanuts) provide protein and healthy fats for sustained energy.",
    "Citrus fruits like oranges and lemons boost immunity with vitamin C.",
    "Locally sourced produce contains more nutrients than imported options.",
    "Seasonal fruits and vegetables are naturally more nutrient-dense.",
    "Supporting local farms reduces food miles and carbon footprint.",
    "Farmly’s fresh produce is harvested at peak ripeness for maximum flavor and nutrition.",
    "Eating a variety of tubers, fruits, and vegetables helps maintain balanced nutrition.",
    "Yams and plantains are excellent energy sources for active lifestyles.",
    "Root crops like cassava and sweet potato provide essential complex carbohydrates.",
    "Leafy greens from local farms retain more minerals and vitamins than long-stored imports."
];

const brandInsights = [
    "Receive fresh, chemical-free produce delivered to Lagos twice a month. Order before Thursday cutoff for on-time delivery.",
    "We offer two flexible delivery options: Express and Standard, each at their own costs.",
    "We empower Delta State farmers by offering fair pricing and pre-order access to their fresh harvests.",
    "All our farm produce is grown naturally, without synthetic chemicals, ensuring the freshest and healthiest options.",
    "Farmly connects Lagos residents with Delta farms, bringing fresh, natural produce straight to your door while supporting local farmers.",
    "Curate your order exactly the way you want — choose the quantity and types of fresh produce you need."
];

// Separate indexes for smoother rotation
let agriIndex = 0;
let brandIndex = 0;
let autoRotateInterval;

function updateFact(elementId, text) {
    const el = document.getElementById(elementId);
    el.style.opacity = 0;
    setTimeout(() => {
        el.textContent = text;
        el.style.opacity = 1;
    }, 300); // fade transition
}

function rotateFacts() {
    updateFact("agri-nutri-fact", agriNutriFacts[agriIndex % agriNutriFacts.length]);
    updateFact("brand-fact", brandInsights[brandIndex % brandInsights.length]);
    agriIndex++;
    brandIndex++;
}

// Manual navigation
function showNextFact() {
    rotateFacts();
    resetAutoRotate();
}

function showPrevFact() {
    agriIndex = (agriIndex - 2 + agriNutriFacts.length) % agriNutriFacts.length;
    brandIndex = (brandIndex - 2 + brandInsights.length) % brandInsights.length;
    rotateFacts();
    resetAutoRotate();
}

// Auto-rotate with reset
function startAutoRotate() {
    autoRotateInterval = setInterval(rotateFacts, 8000);
}

function resetAutoRotate() {
    clearInterval(autoRotateInterval);
    startAutoRotate();
}

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

    // Prevent default anchor
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', e => e.preventDefault());
    });

    // Initial rotation
    rotateFacts();
    startAutoRotate();

    // Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselElements = document.querySelectorAll("#agri-nutri-fact, #brand-fact");

    carouselElements.forEach(el => {
        el.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        el.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipeGesture();
        });
    });

    function handleSwipeGesture() {
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance > 50) {
            showPrevFact();
        } else if (swipeDistance < -50) {
            showNextFact();
        }
    }
});