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

    // Contact form submission handler (optional enhancement)
    const form = document.getElementById("contact-form");
    const response = document.getElementById("form-response");

    if (form && response) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            // Simulate success (you can replace this with actual form handling logic)
            response.style.display = "block";
            response.textContent = "Message sent successfully!";
            form.reset();
        });
    }
});
