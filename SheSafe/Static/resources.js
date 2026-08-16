document.addEventListener("DOMContentLoaded", function () {

    // Smooth scrolling for resource links
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

    });


    // Add a small animation when resource cards enter the screen
    const cards = document.querySelectorAll(".resource-card");

    const observer = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);
                }

            });

        },
        {
            threshold: 0.15
        }
    );


    cards.forEach(function (card) {
        observer.observe(card);
    });


    // Prevent empty links from jumping to the top
    document.querySelectorAll('a[href="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {
            event.preventDefault();
        });

    });

});