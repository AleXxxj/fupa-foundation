/* ============================================================
   FUPA FOUNDATION NIGERIA - MAIN JAVASCRIPT
   v2: Donation flow now wired to /api/donate (Paystack)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {

    // ---------- DOM ELEMENTS ----------
    const header = document.getElementById('header');
    const nav = document.getElementById('nav');
    const mobileToggle = document.getElementById('mobileToggle');
    const backToTop = document.getElementById('backToTop');
    const donateModal = document.getElementById('donateModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const donateSubmit = document.getElementById('donateSubmit');
    const donateError = document.getElementById('donateError');
    const donorName = document.getElementById('donorName');
    const donorEmail = document.getElementById('donorEmail');
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterSuccess = document.getElementById('newsletterSuccess');
    const customAmount = document.getElementById('customAmount');
    const amountButtons = document.querySelectorAll('.modal__amount');
    const navLinks = document.querySelectorAll('.nav__link');
    const donateButtons = document.querySelectorAll('[href="#donate"]');
    const counters = [
        { element: document.getElementById('counter1'), target: 15000, suffix: '' },
        { element: document.getElementById('counter2'), target: 42, suffix: '' },
        { element: document.getElementById('counter3'), target: 8, suffix: '' },
        { element: document.getElementById('counter4'), target: 97, suffix: '' }
    ];

    let selectedAmount = 25000;
    let countersAnimated = false;


    // ========================================================
    // 1. STICKY HEADER SCROLL EFFECT
    // ========================================================
    function handleScroll() {
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }

        if (window.scrollY > 600) {
            backToTop.classList.add('back-to-top--visible');
        } else {
            backToTop.classList.remove('back-to-top--visible');
        }

        if (!countersAnimated) {
            const counterBar = document.querySelector('.counter-bar');
            if (counterBar) {
                const barPosition = counterBar.getBoundingClientRect().top;
                const screenPosition = window.innerHeight * 0.8;

                if (barPosition < screenPosition) {
                    animateCounters();
                    countersAnimated = true;
                }
            }
        }

        updateActiveNavLink();
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();


    // ========================================================
    // 2. MOBILE NAVIGATION TOGGLE
    // ========================================================
    mobileToggle.addEventListener('click', function() {
        nav.classList.toggle('nav--open');

        const bars = mobileToggle.querySelectorAll('.mobile-toggle__bar');
        if (nav.classList.contains('nav--open')) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (nav.classList.contains('nav--open')) {
                nav.classList.remove('nav--open');
                const bars = mobileToggle.querySelectorAll('.mobile-toggle__bar');
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    });


    // ========================================================
    // 3. ACTIVE NAV LINK HIGHLIGHT ON SCROLL
    // ========================================================
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('nav__link--active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('nav__link--active');
            }
        });
    }


    // ========================================================
    // 4. COUNTER ANIMATION
    // ========================================================
    function animateCounters() {
        counters.forEach(counter => {
            if (!counter.element) return;

            const target = counter.target;
            const duration = 2000;
            const startTime = performance.now();
            const startValue = 0;

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(startValue + (target - startValue) * eased);

                counter.element.textContent = currentValue.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.element.textContent = target.toLocaleString();
                }
            }

            requestAnimationFrame(update);
        });
    }


    // ========================================================
    // 5. BACK TO TOP BUTTON
    // ========================================================
    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // ========================================================
    // 6. DONATE MODAL + PAYSTACK CHECKOUT
    // ========================================================
    function openModal() {
        donateModal.classList.add('modal--visible');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        donateModal.classList.remove('modal--visible');
        document.body.style.overflow = '';
        hideError();
    }

    function showError(message) {
        donateError.textContent = message;
        donateError.hidden = false;
    }

    function hideError() {
        donateError.hidden = true;
    }

    donateButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && donateModal.classList.contains('modal--visible')) {
            closeModal();
        }
    });

    // Amount selection
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            amountButtons.forEach(b => b.classList.remove('modal__amount--active'));
            this.classList.add('modal__amount--active');
            selectedAmount = parseInt(this.getAttribute('data-amount'));
            customAmount.value = '';
            hideError();
        });
    });

    customAmount.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value && value >= 1000) {
            selectedAmount = value;
            amountButtons.forEach(b => b.classList.remove('modal__amount--active'));
        }
    });

    // ---- Submit: call our serverless API, then redirect ----
    donateSubmit.addEventListener('click', async function() {
        hideError();

        const finalAmount = customAmount.value && parseInt(customAmount.value) >= 1000
            ? parseInt(customAmount.value)
            : selectedAmount;

        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const name = donorName.value.trim();
        const email = donorEmail.value.trim();

        // Client-side validation (server validates again)
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Please enter a valid email address so we can send your receipt.');
            donorEmail.focus();
            return;
        }
        if (!finalAmount || finalAmount < 1000) {
            showError('Minimum donation is \u20A61,000.');
            return;
        }

        // Loading state
        const originalHTML = donateSubmit.innerHTML;
        donateSubmit.disabled = true;
        donateSubmit.innerHTML = 'Connecting to Paystack\u2026';

        try {
            const res = await fetch('/api/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email, amount: finalAmount, frequency: frequency })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong.');
            }

            // Hand the donor over to Paystack's secure checkout page
            window.location.href = data.authorization_url;
        } catch (err) {
            showError(err.message || 'Could not connect. Please check your network and try again.');
            donateSubmit.disabled = false;
            donateSubmit.innerHTML = originalHTML;
        }
    });


    // ========================================================
    // 7. NEWSLETTER FORM (backend wiring coming next)
    // ========================================================
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = newsletterForm.querySelector('.newsletter__input');
        const email = emailInput.value.trim();

        if (email && isValidEmail(email)) {
            const submitBtn = newsletterForm.querySelector('.newsletter__btn');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Subscribing...';
            submitBtn.disabled = true;

            setTimeout(function() {
                newsletterForm.style.display = 'none';
                newsletterSuccess.classList.add('newsletter__success--visible');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        } else {
            alert('Please enter a valid email address.');
        }
    });

    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }


    // ========================================================
    // 8. SMOOTH SCROLL FOR ALL ANCHOR LINKS
    // ========================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            if (targetId === '#donate') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });


    // ========================================================
    // 9. INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
    // ========================================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.change-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`;
        observer.observe(card);
    });

    document.querySelectorAll('.partners__item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`;
        observer.observe(item);
    });

    const transparencyBox = document.querySelector('.transparency__box');
    if (transparencyBox) {
        transparencyBox.style.opacity = '0';
        transparencyBox.style.transform = 'translateY(40px)';
        transparencyBox.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(transparencyBox);
    }

    const featuredStory = document.querySelector('.featured-story__inner');
    if (featuredStory) {
        featuredStory.style.opacity = '0';
        featuredStory.style.transform = 'translateY(40px)';
        featuredStory.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s';
        observer.observe(featuredStory);
    }

    console.log('FUPA Foundation Nigeria - initialized (Paystack live).');
});
