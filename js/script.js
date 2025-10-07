// Sticky navigation behavior
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        offset: 100,
        once: true,
        easing: 'ease-out-quad'
    });

    // Handle main navigation active state
    const mainNavLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const mainSections = document.querySelectorAll('section[id]');
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    function updateMainNavActive() {
        // If we're on the case study page, keep "Case Studies" active
        if (!isIndexPage) {
            mainNavLinks.forEach(link => {
                if (link.getAttribute('href').includes('#work')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
            return;
        }

        // For index page, update based on scroll position
        const scrollPosition = window.scrollY + 100;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const isNearBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 100;

        // If we're near the bottom of the page, activate the contact link
        if (isNearBottom) {
            mainNavLinks.forEach(link => {
                if (link.getAttribute('href').includes('#contact')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
            return;
        }

        // Otherwise check each section as before
        mainSections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                mainNavLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.includes(`#${sectionId}`)) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }

    // Update active state on scroll only for index page
    if (isIndexPage) {
        window.addEventListener('scroll', updateMainNavActive);
    }
    
    // Call on page load
    updateMainNavActive();

    // Add smooth scroll to main nav links
    mainNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // If link goes to index page section, don't prevent default
            if (href && href.includes('index.html#')) {
                return;
            }
            // Handle same-page links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.case-study-nav-list a');

    function updateActiveLink() {
        const scrollPosition = window.scrollY + 100; // Add offset for better active state

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Update active state on scroll
    window.addEventListener('scroll', updateActiveLink);
    
    // Smooth scroll to sections
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            targetSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
    const header = document.getElementById('mainHeader');
    const hero = document.getElementById('hero');
    
    function handleScroll() {
        const heroHeight = hero.offsetHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > heroHeight - 1100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Listen for scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Check initial state
    handleScroll();
    
    // Load testimonials from Google Sheets CMS
    loadTestimonials();
});

// Function to load testimonials from Google Sheets
async function loadTestimonials() {
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vSXBMiF0d4wz_LD-7WX40pHxHk9J70qqPc-w6wJwkt7KQLMvQMMsgFIHcsKUIKO6-d4E8Mh3-Vj6yjm/pub?output=csv');
        const csvText = await response.text();
        const testimonials = parseCSV(csvText);
        
        // Update the testimonials section
        updateTestimonialsSection(testimonials);
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

// Function to parse CSV data
function parseCSV(csvText) {
    const cleanText = csvText.trim().replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/);

    if (lines.length < 2) {
        console.error("CSV PARSE ERROR: No data rows found.");
        return [];
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    console.log("Headers found in CMS:", headers);

    const findHeaderIndex = (possibleNames) => {
        for (const name of possibleNames) {
            const index = headers.indexOf(name);
            if (index !== -1) return index;
        }
        for (const name of possibleNames) {
             const index = headers.findIndex(h => h.includes(name));
             if (index !== -1) return index;
        }
        return -1;
    };

    const idx = {
        name: findHeaderIndex(['name']),
        role: findHeaderIndex(['role', 'role & company']),
        testimonial: findHeaderIndex(['testimonial']),
        avatar: findHeaderIndex(['avatar'])
    };

    if (idx.name === -1 || idx.testimonial === -1) {
        console.error("CSV PARSE ERROR: Could not find required columns.");
        return [];
    }

    const testimonials = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const rowData = {
            name: (values[idx.name] || '').trim(),
            role: (values[idx.role] || '').trim(),
            testimonial: (values[idx.testimonial] || '').trim(),
            avatar: (values[idx.avatar] || '').trim()
        };

        if (rowData.name && rowData.testimonial) {
            testimonials.push(rowData);
        }
    }

    console.log(`Successfully parsed ${testimonials.length} valid testimonials.`);
    return testimonials;
}

// Function to parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Function to update the testimonials section
function updateTestimonialsSection(testimonials) {
    const testimonialsContainer = document.querySelector('.glide__slides');
    if (!testimonialsContainer) {
        console.error("Testimonials container not found.");
        return;
    }

    const valid = (testimonials || []).filter(t => t.name && t.testimonial);
    if (!valid.length) {
        console.log("No valid testimonials to display.");
        return;
    }

    testimonialsContainer.innerHTML = '';
    valid.forEach((t, i) => testimonialsContainer.appendChild(createTestimonialCard(t, i)));
    
    // Initialize Glide.js after cards are loaded
    initGlideCarousel();
}

// Function to create a testimonial card
function createTestimonialCard(testimonial, index) {
    const slide = document.createElement('li');
    slide.className = 'glide__slide';

    const processedTestimonial = processTestimonialText(testimonial.testimonial);
    const avatarPath = getAvatarPath(testimonial);
    const avatarImg = avatarPath
        ? `<img src="${avatarPath}" alt="${testimonial.name}" class="w-100 h-100 rounded-circle" style="object-fit: cover;" onerror="this.style.display='none';">`
        : '';

    slide.innerHTML = `
        <div class="testimonial-card p-4">
            <div class="d-flex align-items-center mb-3">
                <div class="avatar me-3">${avatarImg}</div>
                <div>
                    <div class="fw-bold">${testimonial.name}</div>
                    <div class="text-muted small">${testimonial.role}</div>
                </div>
            </div>
            <p class="mb-0 testimonial-text">${processedTestimonial}</p>
        </div>
    `;
    return slide;
}

// Function to process testimonial text and convert <br> tags to HTML
function processTestimonialText(text) {
    if (!text) return '';
    return text.replace(/<br\s*\/?>/gi, '<br>');
}

// Function to get the avatar image path based on the person's name
function getAvatarPath(testimonial) {
    const explicit = (testimonial.avatar || '').trim();
    if (explicit) {
        if (/^https?:\/\//i.test(explicit)) return explicit;
        return `./assets/images/testimonials/${explicit}`;
    }
    return '';
}

// Initialize Glide.js carousel
function initGlideCarousel() {
    const glideElement = document.querySelector('.glide');
    if (!glideElement) return;

    // Remove any existing Glide instance
    if (glideElement._glide) {
        glideElement._glide.destroy();
    }

    // Initialize new Glide instance
    const glide = new Glide(glideElement, {
        type: 'carousel',
        autoplay: 5000, // Autoplay every 5 seconds
        hoverpause: true, // Pause autoplay on hover
        perView: 2, // Show 2 slides on desktop
        gap: 40, // Increased space between slides
        breakpoints: {
            768: {
                perView: 1, // Show 1 slide on mobile
                gap: 20
            }
        }
    });

    // Mount the Glide instance
    glide.mount();
    
    // Store the instance for cleanup
    glideElement._glide = glide;
}