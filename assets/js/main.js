// assets/js/main.js - English Version

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Device detection
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTabletDevice() {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || 
           (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
}

function isDesktopDevice() {
    return !isMobileDevice() && !isTabletDevice();
}

// Platform selection functions
function goToMobile() {
    if (isMobileDevice() && !isTabletDevice()) {
        window.location.href = 'mobile/';
    } else {
        showPlatformWarning('mobile');
    }
}

function goToDesktop() {
    if (isDesktopDevice() || isTabletDevice()) {
        window.location.href = 'desktop/';
    } else {
        showPlatformWarning('desktop');
    }
}

// Show platform warning
function showPlatformWarning(targetPlatform) {
    const currentDevice = isMobileDevice() && !isTabletDevice() ? 'mobile' : 'desktop';
    const message = targetPlatform === 'mobile' 
        ? 'This application is designed for mobile devices only. Please use a phone or tablet.'
        : 'This application is designed for desktop and tablet devices. Please use a computer or tablet.';
    
    // Create warning modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        color: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        max-width: 400px;
        border: 3px solid #e74c3c;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h3 style="color: #e74c3c; margin-bottom: 15px; font-size: 20px;">Platform Warning</h3>
        <p style="margin-bottom: 25px; line-height: 1.5; font-size: 16px;">${message}</p>
        <button id="closeWarning" style="
            background: #e74c3c;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s;
        ">OK</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close button event
    document.getElementById('closeWarning').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Update platform cards based on device
function updatePlatformCards() {
    const mobileCard = document.querySelector('.mobile-card');
    const desktopCard = document.querySelector('.desktop-card');
    
    if (isMobileDevice() && !isTabletDevice()) {
        // On mobile device - disable desktop card
        desktopCard.style.opacity = '0.5';
        desktopCard.style.cursor = 'not-allowed';
        mobileCard.style.border = '3px solid #00ff88';
        mobileCard.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        
        // Add recommended platform badge
        const recommendedBadge = document.createElement('div');
        recommendedBadge.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            background: #00ff88;
            color: #000;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10;
        `;
        recommendedBadge.textContent = 'RECOMMENDED';
        mobileCard.style.position = 'relative';
        mobileCard.appendChild(recommendedBadge);
        
    } else {
        // On desktop/tablet device - disable mobile card
        mobileCard.style.opacity = '0.5';
        mobileCard.style.cursor = 'not-allowed';
        desktopCard.style.border = '3px solid #ff6b6b';
        desktopCard.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.3)';
        
        // Add recommended platform badge
        const recommendedBadge = document.createElement('div');
        recommendedBadge.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            background: #ff6b6b;
            color: #fff;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10;
        `;
        recommendedBadge.textContent = 'RECOMMENDED';
        desktopCard.style.position = 'relative';
        desktopCard.appendChild(recommendedBadge);
    }
}

// Page load initialization
document.addEventListener('DOMContentLoaded', function() {
    // Update platform cards
    updatePlatformCards();
    
    // Platform card hover effects
    const platformCards = document.querySelectorAll('.platform-card');
    
    platformCards.forEach(card => {
        // Prevent hover effect on disabled cards
        if (card.style.cursor !== 'not-allowed') {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        }
    });

    // Scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate elements on scroll
    const animatedElements = document.querySelectorAll('.feature-card, .step');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Platform card click effects
    const mobileCard = document.querySelector('.mobile-card');
    const desktopCard = document.querySelector('.desktop-card');
    
    if (mobileCard && mobileCard.style.cursor !== 'not-allowed') {
        mobileCard.addEventListener('click', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-10px) scale(1)';
                goToMobile();
            }, 150);
        });
    }

    if (desktopCard && desktopCard.style.cursor !== 'not-allowed') {
        desktopCard.addEventListener('click', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-10px) scale(1)';
                goToDesktop();
            }, 150);
        });
    }

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
            }, 0);
        });
    }

    // Service Worker registration for PWA capabilities
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration not available:', error));
    }
});

// Notification display function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: ${type === 'success' ? '#000' : '#fff'};
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10001;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case 'm':
        case 'M':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                goToMobile();
            }
            break;
        case 'd':
        case 'D':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                goToDesktop();
            }
            break;
    }
});

// Analytics event tracking
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Platform selection tracking
document.addEventListener('DOMContentLoaded', function() {
    const mobileCard = document.querySelector('.mobile-card');
    const desktopCard = document.querySelector('.desktop-card');
    
    if (mobileCard && mobileCard.style.cursor !== 'not-allowed') {
        mobileCard.addEventListener('click', () => {
            trackEvent('Platform Selection', 'click', 'Mobile');
        });
    }

    if (desktopCard && desktopCard.style.cursor !== 'not-allowed') {
        desktopCard.addEventListener('click', () => {
            trackEvent('Platform Selection', 'click', 'Desktop');
        });
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    if (e.error && e.error.name !== 'SyntaxError') {
        showNotification('❌ An error occurred', 'error');
    }
});

// Loading animation
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-video fa-spin"></i>
            <p>Loading...</p>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
        loading.remove();
    }
}

// Initialize Google AdSense when page loads
window.addEventListener('DOMContentLoaded', function() {
    // Initialize AdSense ads
    setTimeout(() => {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.log('AdSense initialization delayed');
        }
    }, 1000);
});