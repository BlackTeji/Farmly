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

    // Contact form submission handler with EmailJS
    const form = document.getElementById("contact-form");
    const response = document.getElementById("form-response");

    if (form && response) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            // Send form via EmailJS
            emailjs.sendForm('service_uwuodx9', 'template_tw7t3pe', this, 'z9QvwJnX_tBVswAFy')
                .then(() => {
                    response.style.display = "block";
                    response.textContent = "Message sent successfully!";
                    form.reset();
                }, (err) => {
                    response.style.display = "block";
                    response.textContent = "Failed to send message. Please try again later.";
                    console.error("EmailJS error:", err);
                });
        });
    }
});
