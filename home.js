// FACT ROTATOR
const agriNutriFacts = [
    "Yam is Nigeria’s most cultivated tuber crop.",
    "Cassava is a great source of carbohydrates.",
    "Plantains are rich in vitamin C and potassium.",
    "Okra improves digestion and boosts immunity.",
    "Sweet potatoes support eye health and gut health."
];

const brandInsights = [
    "Farmly delivers fresh produce directly from Delta State farms.",
    "We offer two flexible delivery options: Express and Standard, each at their own costs.",
    "Farmly supports local farmers with fair pricing and pre-order models.",
    "Our yams are grown without synthetic chemicals.",
    "You can customize your order - buy what you want, the way you want it."
];

let index = 0;

function rotateFacts() {
    document.getElementById("agri-nutri-fact").textContent = agriNutriFacts[index % agriNutriFacts.length];
    document.getElementById("brand-fact").textContent = brandInsights[index % brandInsights.length];
    index++;
}

// NAV TOGGLE
document.addEventListener('DOMContentLoaded', () => {
    // Menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });

    // Auto-close on link click (optional)
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('show');
        });
    });

    // Start rotating facts once DOM is ready
    rotateFacts();
    setInterval(rotateFacts, 8000);
});
