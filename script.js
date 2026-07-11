/* ============================================================
   FUPA FOUNDATION NIGERIA - MAIN JAVASCRIPT
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
        // Add shadow to header when scrolled
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
        
        // Show/hide back to top button
        if (window.scrollY > 600) {
            backToTop.classList.add('back-to-top--visible');
        } else {
            backToTop.classList.remove('back-to-top--visible');
        }
        
        // Trigger counter animation when counter bar is visible
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
        
        // Highlight active nav link based on scroll position
        updateActiveNavLink();
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run once on load
    
    
    // ========================================================
    // 2. MOBILE NAVIGATION TOGGLE
    // ========================================================
    mobileToggle.addEventListener('click', function() {
        nav.classList.toggle('nav--open');
        
        // Animate hamburger to X
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
    
    // Close mobile nav when a link is clicked
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
            const suffix = counter.suffix;
            const duration = 2000; // 2 seconds
            const startTime = performance.now();
            const startValue = 0;
            
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth deceleration
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
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    
    // ========================================================
    // 6. DONATE MODAL
    // ========================================================
    function openModal() {
        donateModal.classList.add('modal--visible');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    function closeModal() {
        donateModal.classList.remove('modal--visible');
        document.body.style.overflow = '';
    }
    
    // Open modal when any donate button is clicked
    donateButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });
    
    // Close modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && donateModal.classList.contains('modal--visible')) {
            closeModal();
        }
    });
    
    // Amount selection
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            amountButtons.forEach(b => b.classList.remove('modal__amount--active'));
            // Add active class to clicked button
            this.classList.add('modal__amount--active');
            // Update selected amount
            selectedAmount = parseInt(this.getAttribute('data-amount'));
            // Clear custom input
            customAmount.value = '';
        });
    });
    
    // Custom amount input
    customAmount.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value && value >= 1000) {
            selectedAmount = value;
            // Remove active from preset buttons
            amountButtons.forEach(b => b.classList.remove('modal__amount--active'));
        }
    });
    
    // Handle donation submission
    donateSubmit.addEventListener('click', function() {
        const finalAmount = customAmount.value && parseInt(customAmount.value) >= 1000 
            ? parseInt(customAmount.value) 
            : selectedAmount;
        
        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const frequencyText = frequency === 'monthly' ? 'monthly' : 'one-time';
        
        // In a real implementation, this would redirect to a payment gateway
        // For now, show an alert demonstrating the flow
        alert(`Thank you for your generous ${frequencyText} donation of ₦${finalAmount.toLocaleString()}!\n\nIn a production environment, you would now be redirected to a secure payment gateway (Paystack, Flutterwave, or Stripe) to complete your transaction.`);
        
        closeModal();
    });
    
    
    // ========================================================
    // 7. NEWSLETTER FORM
    // ========================================================
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('.newsletter__input');
        const email = emailInput.value.trim();
        
        if (email && isValidEmail(email)) {
            // Simulate form submission
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
            
            // Skip if it's a donate button (handled by modal)
            if (targetId === '#donate') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
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
    
    // Observe change cards for scroll reveal
    document.querySelectorAll('.change-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`;
        observer.observe(card);
    });
    
    // Observe partner items
    document.querySelectorAll('.partners__item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`;
        observer.observe(item);
    });
    
    // Observe transparency box
    const transparencyBox = document.querySelector('.transparency__box');
    if (transparencyBox) {
        transparencyBox.style.opacity = '0';
        transparencyBox.style.transform = 'translateY(40px)';
        transparencyBox.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(transparencyBox);
    }
    
    // Observe featured story
    const featuredStory = document.querySelector('.featured-story__inner');
    if (featuredStory) {
        featuredStory.style.opacity = '0';
        featuredStory.style.transform = 'translateY(40px)';
        featuredStory.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s';
        observer.observe(featuredStory);
    }
    
    console.log('✅ FUPA Foundation Nigeria - All systems initialized.');
    console.log('   Ready for content population and payment gateway integration.');
});
