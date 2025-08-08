// assets/js/admin-auth.js - Admin Kimlik Doğrulama Sistemi

class AdminAuth {
    constructor() {
        this.isAdmin = false;
        this.adminToken = null;
        this.adminPassword = 'prompter_admin_2025!'; // Güvenli şifre - değiştirilebilir
        this.sessionTimeout = 30 * 60 * 1000; // 30 dakika
        this.sessionTimer = null;
        
        // Sayfa yüklendiğinde session kontrolü
        this.checkExistingSession();
        this.setupKeyboardShortcuts();
    }

    // Mevcut session kontrolü
    checkExistingSession() {
        try {
            const savedToken = sessionStorage.getItem('admin_token');
            const savedTime = sessionStorage.getItem('admin_login_time');
            
            if (savedToken && savedTime) {
                const loginTime = parseInt(savedTime);
                const currentTime = Date.now();
                
                // Session süresi kontrolü
                if (currentTime - loginTime < this.sessionTimeout) {
                    this.adminToken = savedToken;
                    this.isAdmin = true;
                    this.startSessionTimer();
                    this.showAdminMode();
                    console.log('%c👑 Admin modunda giriş yapıldı', 'color: #00ff88; font-weight: bold;');
                } else {
                    this.logout();
                }
            }
        } catch (error) {
            console.error('Session kontrolü hatası:', error);
            this.logout();
        }
    }

    // Admin girişi modalı
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'admin-login-modal';
        modal.innerHTML = `
            <div class="admin-login-content">
                <h3>🔐 Admin Girişi</h3>
                <div style="margin-bottom: 20px;">
                    <label>Yönetici Şifresi:</label>
                    <input type="password" id="adminPasswordInput" placeholder="Şifreyi girin..." style="
                        width: 100%;
                        padding: 12px;
                        margin-top: 8px;
                        border: 2px solid #00ff88;
                        border-radius: 8px;
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        font-size: 16px;
                    ">
                    <small style="color: #888; display: block; margin-top: 5px;">
                        Not: Bu şifre güvenlik amaçlıdır ve sadece yetkili kişiler tarafından bilinmelidir.
                    </small>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="loginBtn" style="
                        background: #00ff88;
                        color: #000;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Giriş Yap</button>
                    <button id="cancelLoginBtn" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: bold;
                    ">İptal</button>
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: center;">
                    Giriş başarılı olursa 30 dakika boyunca admin modunda kalacaksınız.
                </div>
            </div>
        `;

        // Modal stillerini ekle
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            animation: fadeIn 0.3s ease-out;
        `;

        const content = modal.querySelector('.admin-login-content');
        content.style.cssText = `
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 400px;
            width: 90%;
            border: 3px solid #00ff88;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            animation: bounceIn 0.5s ease-out;
            text-align: center;
        `;

        document.body.appendChild(modal);

        // Event listeners
        const passwordInput = modal.querySelector('#adminPasswordInput');
        const loginBtn = modal.querySelector('#loginBtn');
        const cancelBtn = modal.querySelector('#cancelLoginBtn');

        // Enter tuşu ile giriş
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.attemptLogin(passwordInput.value, modal);
            }
        });

        loginBtn.addEventListener('click', () => {
            this.attemptLogin(passwordInput.value, modal);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Modal dışına tıklama ile kapatma
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Otomatik focus
        setTimeout(() => passwordInput.focus(), 100);
    }

    // Giriş denemesi
    attemptLogin(password, modal) {
        if (password === this.adminPassword) {
            // Başarılı giriş
            this.adminToken = this.generateToken();
            this.isAdmin = true;
            
            // Session verilerini kaydet
            sessionStorage.setItem('admin_token', this.adminToken);
            sessionStorage.setItem('admin_login_time', Date.now().toString());
            
            document.body.removeChild(modal);
            this.showAdminMode();
            this.startSessionTimer();
            
            this.showNotification('👑 Admin moduna giriş yapıldı!', 'success');
            console.log('%c👑 Admin girişi başarılı', 'color: #00ff88; font-weight: bold; font-size: 16px;');
            
        } else {
            // Hatalı şifre
            this.showNotification('❌ Hatalı şifre!', 'error');
            modal.querySelector('#adminPasswordInput').value = '';
            modal.querySelector('#adminPasswordInput').focus();
            
            // Güvenlik: 3 yanlış deneme sonrası engelleme
            this.failedAttempts = (this.failedAttempts || 0) + 1;
            if (this.failedAttempts >= 3) {
                document.body.removeChild(modal);
                this.showNotification('🚫 Çok fazla hatalı deneme. 5 dakika bekleyin.', 'error');
                setTimeout(() => {
                    this.failedAttempts = 0;
                }, 5 * 60 * 1000);
            }
        }
    }

    // Token oluştur
    generateToken() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Session timer başlat
    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        this.sessionTimer = setTimeout(() => {
            this.logout();
            this.showNotification('⏰ Admin oturumunuz sona erdi', 'info');
        }, this.sessionTimeout);
    }

    // Admin modunu görsel olarak göster
    showAdminMode() {
        if (!this.isAdmin) return;

        // Admin badge ekle
        this.addAdminBadge();
        
        // Admin hover efektlerini aktifleştir
        this.activateAdminHovers();
        
        // Admin paneli düğmesini göster
        this.showAdminPanelButton();
    }

    // Admin badge ekle
    addAdminBadge() {
        // Zaten varsa çıkar
        const existingBadge = document.querySelector('.admin-badge');
        if (existingBadge) existingBadge.remove();

        const badge = document.createElement('div');
        badge.className = 'admin-badge';
        badge.innerHTML = '👑 Admin Modu';
        badge.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: linear-gradient(45deg, #00ff88, #00cc6a);
            color: #000;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 19999;
            box-shadow: 0 3px 10px rgba(0, 255, 136, 0.5);
            cursor: pointer;
            animation: adminPulse 2s infinite;
        `;

        // Tıklayınca çıkış menüsü
        badge.addEventListener('click', () => {
            this.showLogoutMenu();
        });

        document.body.appendChild(badge);

        // CSS animasyonu ekle
        if (!document.querySelector('#admin-animations')) {
            const style = document.createElement('style');
            style.id = 'admin-animations';
            style.textContent = `
                @keyframes adminPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                @keyframes adminGlow {
                    0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.8); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Admin hover efektlerini aktifleştir
    activateAdminHovers() {
        const adPlaceholders = document.querySelectorAll('.ad-placeholder');
        adPlaceholders.forEach(placeholder => {
            // Admin için özel stil ekle
            placeholder.style.transition = 'all 0.3s ease';
            
            placeholder.addEventListener('mouseenter', () => {
                if (this.isAdmin) {
                    placeholder.style.border = '3px solid #00ff88';
                    placeholder.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
                    placeholder.style.background = 'rgba(0, 255, 136, 0.1)';
                    
                    // Edit ikonunu göster
                    this.showEditIcon(placeholder);
                }
            });

            placeholder.addEventListener('mouseleave', () => {
                if (this.isAdmin) {
                    placeholder.style.border = '2px dashed rgba(255,255,255,0.3)';
                    placeholder.style.boxShadow = 'none';
                    placeholder.style.background = 'rgba(255,255,255,0.1)';
                    
                    // Edit ikonunu gizle
                    this.hideEditIcon(placeholder);
                }
            });
        });
    }

    // Edit ikonu göster
    showEditIcon(placeholder) {
        let editIcon = placeholder.querySelector('.admin-edit-icon');
        if (!editIcon) {
            editIcon = document.createElement('div');
            editIcon.className = 'admin-edit-icon';
            editIcon.innerHTML = '✏️ Düzenle';
            editIcon.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0, 255, 136, 0.9);
                color: #000;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10;
                pointer-events: none;
                animation: bounceIn 0.3s ease-out;
            `;
            placeholder.style.position = 'relative';
            placeholder.appendChild(editIcon);
        }
        editIcon.style.display = 'block';
    }

    // Edit ikonunu gizle
    hideEditIcon(placeholder) {
        const editIcon = placeholder.querySelector('.admin-edit-icon');
        if (editIcon) {
            editIcon.style.display = 'none';
        }
    }

    // Admin panel düğmesini göster
    showAdminPanelButton() {
        // Zaten varsa çıkar
        const existingBtn = document.querySelector('.admin-panel-btn');
        if (existingBtn) existingBtn.remove();

        const panelBtn = document.createElement('button');
        panelBtn.className = 'admin-panel-btn';
        panelBtn.innerHTML = '⚙️ Admin Panel';
        panelBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(45deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: bold;
            z-index: 19999;
            box-shadow: 0 5px 15px rgba(155, 89, 182, 0.4);
            transition: all 0.3s ease;
        `;

        panelBtn.addEventListener('click', () => {
            if (window.adManagerPanel) {
                window.adManagerPanel.openPanel();
            }
        });

        panelBtn.addEventListener('mouseenter', () => {
            panelBtn.style.transform = 'scale(1.1)';
            panelBtn.style.boxShadow = '0 8px 25px rgba(155, 89, 182, 0.6)';
        });

        panelBtn.addEventListener('mouseleave', () => {
            panelBtn.style.transform = 'scale(1)';
            panelBtn.style.boxShadow = '0 5px 15px rgba(155, 89, 182, 0.4)';
        });

        document.body.appendChild(panelBtn);
    }

    // Çıkış menüsü göster
    showLogoutMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            top: 50px;
            left: 10px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #00ff88;
            z-index: 20000;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            animation: slideInDown 0.3s ease-out;
        `;

        menu.innerHTML = `
            <div style="margin-bottom: 10px; font-size: 12px; color: #888;">
                Oturum süresi: ${Math.ceil((this.sessionTimeout - (Date.now() - parseInt(sessionStorage.getItem('admin_login_time')))) / 60000)} dakika
            </div>
            <button onclick="adminAuth.logout()" style="
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
            ">🚪 Çıkış Yap</button>
        `;

        document.body.appendChild(menu);

        // 3 saniye sonra otomatik kapat
        setTimeout(() => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        }, 3000);

        // Dışarı tıklayınca kapat
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
    }

    // Çıkış yap
    logout() {
        this.isAdmin = false;
        this.adminToken = null;
        
        // Session temizle
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_login_time');
        
        // Timer temizle
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        // UI elementlerini temizle
        this.clearAdminUI();
        
        this.showNotification('👋 Admin modundan çıkış yapıldı', 'info');
        console.log('%c👋 Admin çıkışı yapıldı', 'color: #e74c3c; font-weight: bold;');
    }

    // Admin UI elementlerini temizle
    clearAdminUI() {
        const elementsToRemove = [
            '.admin-badge',
            '.admin-panel-btn',
            '.admin-edit-icon'
        ];
        
        elementsToRemove.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => element.remove());
        });

        // Ad placeholder'ların stillerini sıfırla
        const adPlaceholders = document.querySelectorAll('.ad-placeholder');
        adPlaceholders.forEach(placeholder => {
            placeholder.style.border = '2px dashed rgba(255,255,255,0.3)';
            placeholder.style.boxShadow = 'none';
            placeholder.style.background = 'rgba(255,255,255,0.1)';
        });
    }

    // Klavye kısayolları
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+A: Admin girişi/paneli
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                if (this.isAdmin) {
                    if (window.adManagerPanel) {
                        window.adManagerPanel.openPanel();
                    }
                } else {
                    if (this.failedAttempts >= 3) {
                        this.showNotification('🚫 Çok fazla hatalı deneme. Daha sonra tekrar deneyin.', 'error');
                        return;
                    }
                    this.showLoginModal();
                }
            }
            
            // Ctrl+Shift+L: Çıkış yap (sadece admin modunda)
            if (e.ctrlKey && e.shiftKey && e.key === 'L' && this.isAdmin) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    // Admin durumunu kontrol et
    checkAdminStatus() {
        return this.isAdmin;
    }

    // Bildirim göster
    showNotification(message, type = 'info') {
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
            z-index: 21000;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
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
}

// Global admin auth instance
window.adminAuth = new AdminAuth();

// Konsol mesajı
console.log('%c🔐 Admin Auth System Loaded', 'color: #f39c12; font-weight: bold; font-size: 12px;');
console.log('Admin girişi için: Ctrl+Shift+A');
console.log('Admin çıkışı için: Ctrl+Shift+L');