'use strict';

document.addEventListener('DOMContentLoaded', function () {

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Debounce — delays execution until after `delay` ms of inactivity.
     */
    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var context = this;
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    /**
     * Format a number as US-dollar currency string: "$12,345"
     */
    function formatCurrency(num) {
        if (typeof num !== 'number' || isNaN(num)) return '$0';
        return '$' + Math.round(num).toLocaleString('en-US');
    }

    /**
     * Basic email validation via regex.
     */
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // =========================================================================
    // 1. MOBILE NAVIGATION
    // =========================================================================

    var navbarToggle = document.querySelector('.navbar__toggle');
    var navbarMenu = document.querySelector('.navbar__menu');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navbarToggle.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });

        // Close menu when a nav link is clicked
        var navLinks = navbarMenu.querySelectorAll('a');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                navbarToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!navbarMenu.contains(e.target) && !navbarToggle.contains(e.target)) {
                navbarToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            }
        });
    }

    // =========================================================================
    // 2. NAVBAR SCROLL EFFECT
    // =========================================================================

    var navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }
        }, { passive: true });
    }

    // =========================================================================
    // 3. SCROLL ANIMATIONS (IntersectionObserver + [data-animate])
    // =========================================================================

    var animatedElements = document.querySelectorAll('[data-animate]');

    if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
        var animateObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    el.classList.add('animate');

                    // Stagger children that also have [data-animate-child]
                    var children = el.querySelectorAll('[data-animate-child]');
                    children.forEach(function (child, index) {
                        child.style.transitionDelay = (index * 0.1) + 's';
                        child.classList.add('animate');
                    });

                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(function (el) {
            animateObserver.observe(el);
        });
    }

    // =========================================================================
    // 4. ROI CALCULATOR
    // =========================================================================

    var cloudSpendSlider = document.getElementById('cloudSpendSlider');
    var cloudSpendInput = document.getElementById('cloudSpendInput');
    var cloudProvider = document.getElementById('cloudProvider');
    var optimizationLevel = document.getElementById('optimizationLevel');
    var savingsAmountEl = document.getElementById('savingsAmount');
    var roiTimelineEl = document.getElementById('roiTimeline');
    var recommendedPackageEl = document.getElementById('recommendedPackage');

    var roiAnimationId = null;

    function getSavingsRate(level) {
        switch (level) {
            case 'None':       return 0.30;
            case 'Basic':      return 0.20;
            case 'Intermediate': return 0.12;
            default:           return 0.30;
        }
    }

    function getProviderModifier(provider) {
        if (provider === 'Multi-cloud') return 1.1;
        return 1.0;
    }

    function getRoiTimeline(annualSavings) {
        if (annualSavings > 100000) return '2-3 months';
        if (annualSavings > 50000) return '3-4 months';
        return '4-6 months';
    }

    function getRecommendedPackage(monthlySpend) {
        if (monthlySpend > 100000) return 'FinOps Enterprise';
        if (monthlySpend > 50000) return 'FinOps Complete';
        if (monthlySpend > 25000) return 'FinOps Accelerator';
        return 'FinOps Starter';
    }

    /**
     * Animate a number counting up from 0 to target over ~1 second.
     */
    function animateSavingsNumber(targetValue) {
        if (roiAnimationId) cancelAnimationFrame(roiAnimationId);
        if (!savingsAmountEl) return;

        var start = 0;
        var duration = 1000; // 1 second
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease-out deceleration
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(eased * targetValue);
            savingsAmountEl.textContent = formatCurrency(current);

            if (progress < 1) {
                roiAnimationId = requestAnimationFrame(step);
            }
        }

        roiAnimationId = requestAnimationFrame(step);
    }

    function calculateROI() {
        if (!cloudSpendSlider || !cloudSpendInput || !cloudProvider || !optimizationLevel) return;

        var monthlySpend = parseFloat(cloudSpendInput.value) || 0;
        var savingsRate = getSavingsRate(optimizationLevel.value);
        var modifier = getProviderModifier(cloudProvider.value);
        var annualSavings = monthlySpend * savingsRate * modifier * 12;

        animateSavingsNumber(annualSavings);

        if (roiTimelineEl) {
            roiTimelineEl.textContent = getRoiTimeline(annualSavings);
        }
        if (recommendedPackageEl) {
            recommendedPackageEl.textContent = getRecommendedPackage(monthlySpend);
        }
    }

    var debouncedCalculateROI = debounce(calculateROI, 150);

    if (cloudSpendSlider && cloudSpendInput) {
        // Sync slider → number input
        cloudSpendSlider.addEventListener('input', function () {
            cloudSpendInput.value = cloudSpendSlider.value;
            debouncedCalculateROI();
        });

        // Sync number input → slider
        cloudSpendInput.addEventListener('input', function () {
            cloudSpendSlider.value = cloudSpendInput.value;
            debouncedCalculateROI();
        });
    }

    if (cloudProvider) {
        cloudProvider.addEventListener('change', debouncedCalculateROI);
    }
    if (optimizationLevel) {
        optimizationLevel.addEventListener('change', debouncedCalculateROI);
    }

    // Run initial calculation if elements exist
    calculateROI();

    // =========================================================================
    // 5. CONTACT FORM SUBMISSION
    // =========================================================================

    var contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Gather fields
            var nameField = contactForm.querySelector('[name="name"]');
            var emailField = contactForm.querySelector('[name="email"]');
            var companyField = contactForm.querySelector('[name="company"]');
            var spendField = contactForm.querySelector('[name="spend"]') ||
                             contactForm.querySelector('[name="spend-range"]') ||
                             contactForm.querySelector('[name="spendRange"]');
            var submitBtn = contactForm.querySelector('button[type="submit"]') ||
                            contactForm.querySelector('input[type="submit"]');

            var successMsg = contactForm.querySelector('.form__success');
            var errorMsg = contactForm.querySelector('.form__error');

            // Hide previous messages
            if (successMsg) successMsg.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';

            // Validate required fields
            var errors = [];
            if (nameField && !nameField.value.trim()) errors.push('Name is required.');
            if (emailField && !emailField.value.trim()) {
                errors.push('Email is required.');
            } else if (emailField && !isValidEmail(emailField.value.trim())) {
                errors.push('Please enter a valid email address.');
            }
            if (companyField && !companyField.value.trim()) errors.push('Company is required.');
            if (spendField && !spendField.value.trim()) errors.push('Please select a spend range.');

            if (errors.length > 0) {
                if (errorMsg) {
                    errorMsg.textContent = errors[0];
                    errorMsg.style.display = 'block';
                }
                return;
            }

            // Loading state
            var originalBtnText = '';
            if (submitBtn) {
                originalBtnText = submitBtn.textContent || submitBtn.value;
                submitBtn.classList.add('btn--loading');
                if (submitBtn.tagName === 'BUTTON') {
                    submitBtn.textContent = 'Sending...';
                } else {
                    submitBtn.value = 'Sending...';
                }
                submitBtn.disabled = true;
            }

            // Prepare data
            var formData = new FormData(contactForm);
            var actionUrl = contactForm.action || window.location.href;

            fetch(actionUrl, {
                method: 'POST',
                body: formData
            })
            .then(function (response) {
                if (!response.ok) throw new Error('Server error: ' + response.status);
                return response;
            })
            .then(function () {
                if (successMsg) {
                    successMsg.style.display = 'block';
                }
                contactForm.reset();
            })
            .catch(function () {
                if (errorMsg) {
                    errorMsg.textContent = 'Something went wrong. Please try again later.';
                    errorMsg.style.display = 'block';
                }
            })
            .finally(function () {
                if (submitBtn) {
                    submitBtn.classList.remove('btn--loading');
                    if (submitBtn.tagName === 'BUTTON') {
                        submitBtn.textContent = originalBtnText;
                    } else {
                        submitBtn.value = originalBtnText;
                    }
                    submitBtn.disabled = false;
                }
            });
        });
    }

    // =========================================================================
    // 6. TESTIMONIALS CAROUSEL
    // =========================================================================

    var carousel = document.querySelector('.testimonials__carousel');

    if (carousel) {
        var slides = carousel.querySelectorAll('.testimonial__slide');
        var dots = carousel.querySelectorAll('.testimonial__dot');
        var currentSlide = 0;
        var autoplayTimer = null;
        var isHovered = false;

        function showSlide(index) {
            // Wrap around
            if (index >= slides.length) index = 0;
            if (index < 0) index = slides.length - 1;

            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
                slide.style.opacity = i === index ? '1' : '0';
                slide.style.position = i === index ? 'relative' : 'absolute';
                slide.style.visibility = i === index ? 'visible' : 'hidden';
            });

            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });

            currentSlide = index;
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function startAutoplay() {
            stopAutoplay();
            autoplayTimer = setInterval(function () {
                if (!isHovered) nextSlide();
            }, 5000);
        }

        function stopAutoplay() {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        }

        // Dot navigation
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                showSlide(i);
                startAutoplay(); // Reset timer on manual navigation
            });
        });

        // Pause on hover
        carousel.addEventListener('mouseenter', function () {
            isHovered = true;
        });
        carousel.addEventListener('mouseleave', function () {
            isHovered = false;
        });

        // Initialize
        showSlide(0);
        startAutoplay();
    }

    // =========================================================================
    // 7. SMOOTH SCROLL
    // =========================================================================

    var NAVBAR_OFFSET = 80;

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;

            var targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();

            var targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });

    // =========================================================================
    // 8. ACTIVE NAV LINK HIGHLIGHTING
    // =========================================================================

    var sections = document.querySelectorAll('section[id]');
    var navLinkItems = document.querySelectorAll('.navbar__menu a[href^="#"]');

    if (sections.length > 0 && navLinkItems.length > 0 && 'IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.getAttribute('id');
                    navLinkItems.forEach(function (link) {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            rootMargin: '-' + NAVBAR_OFFSET + 'px 0px -50% 0px',
            threshold: 0
        });

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }

    // =========================================================================
    // 9. NUMBER COUNTER ANIMATION
    // =========================================================================

    /**
     * Animate a counter element from 0 to target.
     * @param {HTMLElement} element - DOM element to update
     * @param {number} target - Target number
     * @param {number} [duration=1500] - Animation duration in ms
     * @param {string} [prefix='$'] - Text before the number
     * @param {string} [suffix=''] - Text after the number
     */
    function animateCounter(element, target, duration, prefix, suffix) {
        if (!element) return;
        duration = duration || 1500;
        prefix = prefix !== undefined ? prefix : '$';
        suffix = suffix || '';

        var startTime = null;

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function formatWithCommas(n) {
            return Math.round(n).toLocaleString('en-US');
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var easedProgress = easeOutCubic(progress);
            var current = easedProgress * target;

            element.textContent = prefix + formatWithCommas(current) + suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    // Trigger counter animations when elements scroll into view
    var counterElements = document.querySelectorAll('[data-counter]');

    if (counterElements.length > 0 && 'IntersectionObserver' in window) {
        var counterObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseFloat(el.getAttribute('data-counter')) || 0;
                    var duration = parseFloat(el.getAttribute('data-counter-duration')) || 1500;
                    var prefix = el.getAttribute('data-counter-prefix');
                    if (prefix === null) prefix = '$';
                    var suffix = el.getAttribute('data-counter-suffix') || '';

                    animateCounter(el, target, duration, prefix, suffix);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1 });

        counterElements.forEach(function (el) {
            counterObserver.observe(el);
        });
    }

    // =========================================================================
    // 10. NEWSLETTER FORM
    // =========================================================================

    var newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var emailInput = newsletterForm.querySelector('input[type="email"]') ||
                             newsletterForm.querySelector('[name="email"]');

            if (!emailInput || !isValidEmail(emailInput.value.trim())) {
                var errEl = newsletterForm.querySelector('.form__error');
                if (errEl) {
                    errEl.textContent = 'Please enter a valid email address.';
                    errEl.style.display = 'block';
                    setTimeout(function () { errEl.style.display = 'none'; }, 3000);
                }
                return;
            }

            // Show success message
            var successEl = newsletterForm.querySelector('.form__success');
            if (successEl) {
                successEl.style.display = 'block';
                setTimeout(function () { successEl.style.display = 'none'; }, 4000);
            }

            newsletterForm.reset();
        });
    }

    // =========================================================================
    // 11. PARALLAX-LITE (Hero floating elements)
    // =========================================================================

    var heroSection = document.querySelector('.hero');
    var floatingElements = document.querySelectorAll('.hero__float, .hero__floating, .floating-element');

    if (heroSection && floatingElements.length > 0) {
        var parallaxRafId = null;
        var mouseX = 0;
        var mouseY = 0;

        heroSection.addEventListener('mousemove', function (e) {
            var rect = heroSection.getBoundingClientRect();
            // Normalise to -1 … 1
            mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

            if (!parallaxRafId) {
                parallaxRafId = requestAnimationFrame(applyParallax);
            }
        });

        function applyParallax() {
            floatingElements.forEach(function (el, index) {
                var speed = (index + 1) * 8; // Different speed per element
                var x = mouseX * speed;
                var y = mouseY * speed;
                el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
            });
            parallaxRafId = null;
        }
    }

    // =========================================================================
    // 12. LAZY LOADING FALLBACK
    // =========================================================================

    if (!('loading' in HTMLImageElement.prototype)) {
        var lazyImages = document.querySelectorAll('img[loading="lazy"]');

        if (lazyImages.length > 0 && 'IntersectionObserver' in window) {
            var lazyObserver = new IntersectionObserver(function (entries, observer) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                        }
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                        }
                        img.removeAttribute('loading');
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '200px 0px' });

            lazyImages.forEach(function (img) {
                lazyObserver.observe(img);
            });
        }
    }

    // =========================================================================
    // 13. FORM INPUT ANIMATIONS
    // =========================================================================

    var formGroups = document.querySelectorAll('.form__group');

    formGroups.forEach(function (group) {
        var input = group.querySelector('input, textarea, select');
        if (!input) return;

        input.addEventListener('focus', function () {
            group.classList.add('focused');
        });

        input.addEventListener('blur', function () {
            group.classList.remove('focused');
            if (input.value && input.value.trim() !== '') {
                group.classList.add('has-value');
            } else {
                group.classList.remove('has-value');
            }
        });

        // Initialise has-value for pre-filled inputs
        if (input.value && input.value.trim() !== '') {
            group.classList.add('has-value');
        }
    });

    // =========================================================================
    // 14. WHATSAPP BUTTON
    // =========================================================================

    var whatsappBtn = document.querySelector('.whatsapp-btn, .whatsapp-button, #whatsappButton');

    if (whatsappBtn && heroSection) {
        // Initially hidden
        whatsappBtn.style.opacity = '0';
        whatsappBtn.style.visibility = 'hidden';
        whatsappBtn.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';

        window.addEventListener('scroll', function () {
            var heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            if (window.scrollY > heroBottom) {
                whatsappBtn.style.opacity = '1';
                whatsappBtn.style.visibility = 'visible';
            } else {
                whatsappBtn.style.opacity = '0';
                whatsappBtn.style.visibility = 'hidden';
            }
        }, { passive: true });
    }

});
