// assets/js/ad-manager.js - Basit Ad Manager (Sadece HTML/JS ve Google Ads)

class AdManager {
    constructor() {
        this.ads = this.loadAds();
        this.initializeAds();
        this.setupEventListeners();
    }

    loadAds() {
        try {
            const savedAds = localStorage.getItem('prompter_ads');
            return savedAds ? JSON.parse(savedAds) : {};
        } catch (error) {
            console.error('Reklam verileri yüklenirken hata:', error);
            return {};
        }
    }

    saveAds() {
        try {
            localStorage.setItem('prompter_ads', JSON.stringify(this.ads));
            console.log('✅ Ad data saved successfully');
        } catch (error) {
            console.error('Reklam verileri kaydedilirken hata:', error);
        }
    }

    initializeAds() {
        const adPlaceholders = document.querySelectorAll('.ad-placeholder');
        adPlaceholders.forEach((placeholder, index) => {
            const adId = this.generateAdId(placeholder, index);
            
            if (this.ads[adId]) {
                this.renderAd(placeholder, this.ads[adId]);
            }
            
            placeholder.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.adminAuth && window.adminAuth.checkAdminStatus()) {
                    this.openAdEditor(placeholder, adId);
                } else {
                    console.log('Reklam alanına tıklandı (Sadece admin düzenleyebilir)');
                }
            });
        });
    }

    generateAdId(element, index) {
        // data-ad-id varsa onu kullan
        if (element.getAttribute('data-ad-id')) {
            return element.getAttribute('data-ad-id');
        }
        
        // Yoksa parent element'e göre oluştur
        const parent = element.closest('.ad-banner, .ad-sidebar, .ad-panel, .ad-panel-top, .ad-panel-bottom, .ad-banner-top, .ad-banner-bottom');
        let adType = 'unknown';
        
        if (parent) {
            if (parent.classList.contains('ad-banner-top')) adType = 'top-banner';
            else if (parent.classList.contains('ad-banner-bottom')) adType = 'bottom-banner';
            else if (parent.classList.contains('ad-top')) adType = 'top-banner';
            else if (parent.classList.contains('ad-middle')) adType = 'middle-banner';
            else if (parent.classList.contains('ad-bottom')) adType = 'bottom-banner';
            else if (parent.classList.contains('ad-sidebar')) adType = 'sidebar';
            else if (parent.classList.contains('ad-panel-top')) adType = 'panel-top';
            else if (parent.classList.contains('ad-panel-bottom')) adType = 'panel-bottom';
            else if (parent.classList.contains('ad-panel')) adType = 'panel-middle';
        }
        
        return adType + '-' + index;
    }

    // HTML reklam render etme - boyut kontrolü ile
    renderAd(placeholder, adData) {
        placeholder.innerHTML = '';
        
        if (adData.type === 'html') {
            // HTML/CSS/JS reklamı
            const adContainer = document.createElement('div');
            adContainer.innerHTML = adData.content;
            adContainer.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                ${adData.width ? `max-width: ${adData.width}px;` : ''}
                ${adData.height ? `max-height: ${adData.height}px;` : ''}
            `;
            
            // Eğer boyutlar belirtilmişse placeholder'ı da ayarla
            if (adData.width && adData.height) {
                placeholder.style.width = adData.width + 'px';
                placeholder.style.height = adData.height + 'px';
                placeholder.style.minWidth = adData.width + 'px';
                placeholder.style.minHeight = adData.height + 'px';
            }
            
            // JavaScript varsa çalıştır
            if (adData.script) {
                try {
                    const script = document.createElement('script');
                    script.textContent = adData.script;
                    adContainer.appendChild(script);
                    console.log(`✅ HTML Ad with JS rendered: ${adData.name}`);
                } catch (jsError) {
                    console.error(`❌ JS execution error for ${adData.name}:`, jsError);
                    this.showAdError(placeholder, 'JavaScript execution failed');
                    return;
                }
            } else {
                console.log(`✅ HTML Ad rendered: ${adData.name}`);
            }
            
            placeholder.appendChild(adContainer);
            
            // Tıklama olayı
            if (adData.url) {
                placeholder.style.cursor = 'pointer';
                placeholder.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Tıklama sayacı
                    if (!adData.clicks) adData.clicks = 0;
                    adData.clicks++;
                    this.saveAds();
                    console.log(`📊 Ad click tracked for ${adData.name}: ${adData.clicks}`);
                    window.open(adData.url, '_blank', 'noopener,noreferrer');
                });
            }
            
        } else if (adData.type === 'google') {
            // Google AdSense reklamı
            const adContainer = document.createElement('ins');
            adContainer.className = 'adsbygoogle';
            adContainer.style.display = 'block';
            
            if (adData.client) adContainer.setAttribute('data-ad-client', adData.client);
            if (adData.slot) adContainer.setAttribute('data-ad-slot', adData.slot);
            if (adData.format) adContainer.setAttribute('data-ad-format', adData.format);
            if (adData.responsive) adContainer.setAttribute('data-full-width-responsive', 'true');
            if (adData.width && adData.height) {
                adContainer.style.width = adData.width + 'px';
                adContainer.style.height = adData.height + 'px';
                placeholder.style.width = adData.width + 'px';
                placeholder.style.height = adData.height + 'px';
            }
            
            placeholder.appendChild(adContainer);
            
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                console.log(`✅ Google Ad rendered: ${adData.name}`);
            } catch (error) {
                console.error('Google Ad render hatası:', error);
                this.showAdError(placeholder, 'Google Ads yüklenemedi');
            }
        }
        
        // Reklam görüntülenme sayacı
        if (!adData.views) adData.views = 0;
        adData.views++;
        adData.lastViewed = new Date().toISOString();
        this.saveAds();
        console.log(`📊 Ad view tracked for ${adData.name}: ${adData.views}`);
    }

    showAdError(placeholder, message) {
        placeholder.innerHTML = `
            <div style="
                padding: 20px;
                text-align: center;
                background: rgba(231, 76, 60, 0.1);
                border: 2px dashed #e74c3c;
                border-radius: 8px;
                color: #e74c3c;
                font-size: 12px;
            ">
                <i class="fas fa-exclamation-triangle"></i>
                <div>${message}</div>
                <small>Lütfen reklam ayarlarını kontrol edin</small>
            </div>
        `;
    }

    // Reklam editörü açma
    openAdEditor(placeholder, adId) {
        if (!window.adminAuth || !window.adminAuth.checkAdminStatus()) {
            console.warn('🚫 Reklam düzenleme erişimi reddedildi');
            if (window.adminAuth) {
                window.adminAuth.showLoginModal();
            }
            return;
        }

        const currentAd = this.ads[adId] || {};
        
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
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 700px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                border: 2px solid #00ff88;
            ">
                <h3 style="color: #00ff88; margin-bottom: 20px; text-align: center;">
                    🎯 Reklam Düzenle (ID: ${adId})
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Reklam Türü:</label>
                    <select id="adType" style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        <option value="html" ${currentAd.type === 'html' ? 'selected' : ''}>HTML/CSS/JS Reklam</option>
                        <option value="google" ${currentAd.type === 'google' ? 'selected' : ''}>Google AdSense</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Reklam Adı:</label>
                    <input type="text" id="adName" value="${currentAd.name || ''}" 
                           placeholder="Banner Reklamı" 
                           style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                </div>

                <!-- HTML/JS Reklam Alanları -->
                <div id="htmlAdFields" style="display: ${currentAd.type === 'html' || !currentAd.type ? 'block' : 'none'};">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">HTML İçerik:</label>
                        <textarea id="htmlContent" placeholder="<div style='padding: 20px; text-align: center; background: #f0f0f0; border-radius: 8px; color: #333;'>Reklam İçeriği</div>" 
                                  style="width: 100%; height: 120px; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white; font-family: monospace;">${currentAd.content || ''}</textarea>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">JavaScript (Opsiyonel):</label>
                        <textarea id="jsScript" placeholder="// Örnek: console.log('Reklam yüklendi');" 
                                  style="width: 100%; height: 80px; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white; font-family: monospace;">${currentAd.script || ''}</textarea>
                        <small style="color: #888; display: block; margin-top: 5px;">Dikkat: Sadece güvenli JavaScript kodu kullanın</small>
                    </div>

                    <!-- Reklam Boyutları HTML için -->
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Reklam Boyutu:</label>
                        <select id="htmlAdSize" onchange="updateHtmlAdSize()" style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                            <option value="custom">Özel Boyut</option>
                            <option value="728x90" ${currentAd.width == 728 && currentAd.height == 90 ? 'selected' : ''}>728x90 - Leaderboard</option>
                            <option value="300x250" ${currentAd.width == 300 && currentAd.height == 250 ? 'selected' : ''}>300x250 - Medium Rectangle</option>
                            <option value="336x280" ${currentAd.width == 336 && currentAd.height == 280 ? 'selected' : ''}>336x280 - Large Rectangle</option>
                            <option value="320x50" ${currentAd.width == 320 && currentAd.height == 50 ? 'selected' : ''}>320x50 - Mobile Banner</option>
                            <option value="320x100" ${currentAd.width == 320 && currentAd.height == 100 ? 'selected' : ''}>320x100 - Large Mobile Banner</option>
                            <option value="160x600" ${currentAd.width == 160 && currentAd.height == 600 ? 'selected' : ''}>160x600 - Wide Skyscraper</option>
                            <option value="250x250" ${currentAd.width == 250 && currentAd.height == 250 ? 'selected' : ''}>250x250 - Square</option>
                            <option value="200x200" ${currentAd.width == 200 && currentAd.height == 200 ? 'selected' : ''}>200x200 - Small Square</option>
                            <option value="125x125" ${currentAd.width == 125 && currentAd.height == 125 ? 'selected' : ''}>125x125 - Button</option>
                            <option value="468x60" ${currentAd.width == 468 && currentAd.height == 60 ? 'selected' : ''}>468x60 - Banner</option>
                            <option value="234x60" ${currentAd.width == 234 && currentAd.height == 60 ? 'selected' : ''}>234x60 - Half Banner</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Genişlik (px):</label>
                            <input type="number" id="htmlWidth" value="${currentAd.width || ''}" 
                                   placeholder="300" 
                                   style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Yükseklik (px):</label>
                            <input type="number" id="htmlHeight" value="${currentAd.height || ''}" 
                                   placeholder="250" 
                                   style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        </div>
                    </div>
                </div>

                <!-- Google Ads Alanları -->
                <div id="googleAdFields" style="display: ${currentAd.type === 'google' ? 'block' : 'none'};">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Publisher ID:</label>
                        <input type="text" id="googleClient" value="${currentAd.client || ''}" 
                               placeholder="ca-pub-1234567890123456" 
                               style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ad Slot:</label>
                        <input type="text" id="googleSlot" value="${currentAd.slot || ''}" 
                               placeholder="1234567890" 
                               style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Format:</label>
                        <select id="googleFormat" style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                            <option value="auto" ${currentAd.format === 'auto' ? 'selected' : ''}>Auto</option>
                            <option value="rectangle" ${currentAd.format === 'rectangle' ? 'selected' : ''}>Rectangle</option>
                            <option value="banner" ${currentAd.format === 'banner' ? 'selected' : ''}>Banner</option>
                            <option value="fluid" ${currentAd.format === 'fluid' ? 'selected' : ''}>Fluid</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="googleResponsive" ${currentAd.responsive ? 'checked' : ''}>
                            <span>Responsive</span>
                        </label>
                    </div>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Genişlik (px):</label>
                            <input type="number" id="googleWidth" value="${currentAd.width || ''}" 
                                   placeholder="300" 
                                   style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Yükseklik (px):</label>
                            <input type="number" id="googleHeight" value="${currentAd.height || ''}" 
                                   placeholder="250" 
                                   style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tıklama URL'si (Opsiyonel):</label>
                    <input type="url" id="adUrl" value="${currentAd.url || ''}" 
                           placeholder="https://example.com" 
                           style="width: 100%; padding: 10px; border: 2px solid #00ff88; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                </div>

                <!-- İstatistikler -->
                ${currentAd.views || currentAd.clicks ? `
                <div style="margin-bottom: 15px; padding: 15px; background: rgba(0, 255, 136, 0.1); border-radius: 8px; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <h4 style="color: #00ff88; margin-bottom: 10px;">📊 İstatistikler</h4>
                    <div style="font-size: 14px;">
                        <div>👀 Görüntülenme: ${currentAd.views || 0}</div>
                        <div>👆 Tıklama: ${currentAd.clicks || 0}</div>
                        ${currentAd.lastViewed ? `<div>📅 Son Görüntüleme: ${new Date(currentAd.lastViewed).toLocaleString('tr-TR')}</div>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button id="saveAd" style="background: #00ff88; color: #000; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        💾 Kaydet
                    </button>
                    <button id="previewAd" style="background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        👁️ Önizle
                    </button>
                    <button id="deleteAd" style="background: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        🗑️ Sil
                    </button>
                    <button id="closeEditor" style="background: #95a5a6; color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        ❌ İptal
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        // HTML reklam boyutu değiştirme fonksiyonu
        window.updateHtmlAdSize = function() {
            const sizeSelect = document.getElementById('htmlAdSize');
            const widthInput = document.getElementById('htmlWidth');
            const heightInput = document.getElementById('htmlHeight');
            
            if (sizeSelect.value !== 'custom') {
                const [width, height] = sizeSelect.value.split('x');
                widthInput.value = width;
                heightInput.value = height;
            }
        };
        
        // Type değiştirme event listener'ı
        document.getElementById('adType').addEventListener('change', (e) => {
            const htmlFields = document.getElementById('htmlAdFields');
            const googleFields = document.getElementById('googleAdFields');
            
            if (e.target.value === 'html') {
                htmlFields.style.display = 'block';
                googleFields.style.display = 'none';
            } else {
                htmlFields.style.display = 'none';
                googleFields.style.display = 'block';
            }
        });
        
        // Event listeners
        document.getElementById('saveAd').addEventListener('click', () => {
            const type = document.getElementById('adType').value;
            const name = document.getElementById('adName').value;
            const url = document.getElementById('adUrl').value;
            
            if (!name.trim()) {
                this.showNotification('Reklam adı gerekli!', 'error');
                return;
            }
            
            const adData = {
                name: name,
                type: type,
                url: url,
                views: this.ads[adId] ? this.ads[adId].views || 0 : 0,
                clicks: this.ads[adId] ? this.ads[adId].clicks || 0 : 0,
                created: this.ads[adId] ? this.ads[adId].created : new Date().toISOString(),
                modified: new Date().toISOString()
            };
            
            if (type === 'html') {
                const content = document.getElementById('htmlContent').value;
                const script = document.getElementById('jsScript').value;
                const width = document.getElementById('htmlWidth').value;
                const height = document.getElementById('htmlHeight').value;
                
                if (!content.trim()) {
                    this.showNotification('HTML içerik gerekli!', 'error');
                    return;
                }
                
                adData.content = content;
                adData.script = script;
                adData.width = width ? parseInt(width) : null;
                adData.height = height ? parseInt(height) : null;
            } else if (type === 'google') {
                adData.client = document.getElementById('googleClient').value;
                adData.slot = document.getElementById('googleSlot').value;
                adData.format = document.getElementById('googleFormat').value;
                adData.responsive = document.getElementById('googleResponsive').checked;
                adData.width = document.getElementById('googleWidth').value;
                adData.height = document.getElementById('googleHeight').value;
                
                if (!adData.client || !adData.slot) {
                    this.showNotification('Publisher ID ve Ad Slot gerekli!', 'error');
                    return;
                }
            }
            
            this.ads[adId] = adData;
            this.saveAds();
            this.renderAd(placeholder, adData);
            document.body.removeChild(modal);
            
            this.showNotification('✅ Reklam kaydedildi', 'success');
            console.log(`✅ Ad saved: ${adId} - ${adData.name}`);
        });
        
        document.getElementById('previewAd').addEventListener('click', () => {
            const type = document.getElementById('adType').value;
            
            if (type === 'html') {
                const content = document.getElementById('htmlContent').value;
                const script = document.getElementById('jsScript').value;
                const width = document.getElementById('htmlWidth').value;
                const height = document.getElementById('htmlHeight').value;
                
                if (content.trim()) {
                    const previewWindow = window.open('', '_blank', 'width=800,height=600');
                    previewWindow.document.write(`
                        <html>
                            <head>
                                <title>Reklam Önizleme</title>
                                <style>
                                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f0f0f0; }
                                    .preview-container { 
                                        border: 2px dashed #ccc; 
                                        padding: 10px; 
                                        margin: 10px 0; 
                                        background: white;
                                        ${width && height ? `width: ${width}px; height: ${height}px;` : ''}
                                    }
                                </style>
                            </head>
                            <body>
                                <h3>Reklam Önizleme ${width && height ? `(${width}x${height}px)` : ''}</h3>
                                <div class="preview-container">
                                    ${content}
                                </div>
                                ${script ? `<script>${script}</script>` : ''}
                            </body>
                        </html>
                    `);
                    previewWindow.document.close();
                } else {
                    this.showNotification('Önizleme için HTML içerik gerekli!', 'error');
                }
            } else {
                this.showNotification('Google Ads önizlemesi için reklamı kaydedin', 'info');
            }
        });
        
        document.getElementById('deleteAd').addEventListener('click', () => {
            if (confirm('Reklamı silmek istediğinizden emin misiniz?')) {
                delete this.ads[adId];
                this.saveAds();
                
                // Varsayılan placeholder'a döndür
                placeholder.innerHTML = `
                    <i class="fas fa-ad"></i>
                    <span>Reklam Alanı</span>
                `;
                placeholder.style.cursor = 'default';
                
                document.body.removeChild(modal);
                this.showNotification('🗑️ Reklam silindi', 'info');
                console.log(`🗑️ Ad deleted: ${adId}`);
            }
        });
        
        document.getElementById('closeEditor').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Modal dışına tıklama ile kapatma
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // ESC tuşu ile kapatma
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    setupEventListeners() {
        // Sayfa kapatılırken verileri kaydet
        window.addEventListener('beforeunload', () => {
            this.saveAds();
        });

        // Sayfa görünürlük değişikliğinde kaydet
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveAds();
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10001;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: ${type === 'success' ? '#000' : '#fff'};
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

    exportAds() {
        const data = {
            ads: this.ads,
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalAds: Object.keys(this.ads).length
        };
        
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompter-ads-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('📁 Veriler dışa aktarıldı', 'success');
        console.log('📁 Ads exported successfully');
    }

    importAds(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                let importedAds = {};
                
                // Eski format kontrolü
                if (importedData.ads) {
                    importedAds = importedData.ads;
                } else {
                    importedAds = importedData;
                }
                
                // Mevcut reklamları koru, yenilerini ekle
                this.ads = Object.assign(this.ads, importedAds);
                this.saveAds();
                
                // Sayfayı yenile
                setTimeout(() => {
                    location.reload();
                }, 1000);
                
                this.showNotification(`📁 ${Object.keys(importedAds).length} reklam içe aktarıldı`, 'success');
                console.log(`📁 ${Object.keys(importedAds).length} ads imported successfully`);
            } catch (error) {
                this.showNotification('❌ Dosya okuma hatası', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    // Gelişmiş reklam boyutları yönetimi
    getAdSizePresets() {
        return {
            'custom': { name: 'Özel Boyut', width: null, height: null },
            '728x90': { name: 'Leaderboard', width: 728, height: 90 },
            '300x250': { name: 'Medium Rectangle', width: 300, height: 250 },
            '336x280': { name: 'Large Rectangle', width: 336, height: 280 },
            '320x50': { name: 'Mobile Banner', width: 320, height: 50 },
            '320x100': { name: 'Large Mobile Banner', width: 320, height: 100 },
            '160x600': { name: 'Wide Skyscraper', width: 160, height: 600 },
            '250x250': { name: 'Square', width: 250, height: 250 },
            '200x200': { name: 'Small Square', width: 200, height: 200 },
            '125x125': { name: 'Button', width: 125, height: 125 },
            '468x60': { name: 'Banner', width: 468, height: 60 },
            '234x60': { name: 'Half Banner', width: 234, height: 60 },
            '88x31': { name: 'Micro Bar', width: 88, height: 31 }
        };
    }

    // Reklam boyutu önerisi
    suggestAdSize(placeholder) {
        const rect = placeholder.getBoundingClientRect();
        const presets = this.getAdSizePresets();
        
        // En yakın boyutu bul
        let bestMatch = null;
        let bestScore = Infinity;
        
        Object.entries(presets).forEach(([key, preset]) => {
            if (preset.width && preset.height) {
                const widthDiff = Math.abs(rect.width - preset.width);
                const heightDiff = Math.abs(rect.height - preset.height);
                const score = widthDiff + heightDiff;
                
                if (score < bestScore) {
                    bestScore = score;
                    bestMatch = { key, ...preset };
                }
            }
        });
        
        return bestMatch;
    }

    // Admin paneli için reklam boyutları raporu
    getAdSizesReport() {
        const report = [];
        const presets = this.getAdSizePresets();
        
        Object.entries(this.ads).forEach(([id, ad]) => {
            const sizeInfo = {
                id,
                name: ad.name || 'Adsız',
                type: ad.type,
                width: ad.width || 'Auto',
                height: ad.height || 'Auto',
                preset: 'Özel'
            };
            
            // Preset boyut mu kontrol et
            if (ad.width && ad.height) {
                const sizeKey = `${ad.width}x${ad.height}`;
                if (presets[sizeKey]) {
                    sizeInfo.preset = presets[sizeKey].name;
                }
            }
            
            report.push(sizeInfo);
        });
        
        return report;
    }

    // Gelişmiş istatistikler
    getStats() {
        const stats = {
            totalAds: Object.keys(this.ads).length,
            htmlAds: 0,
            googleAds: 0,
            totalViews: 0,
            totalClicks: 0,
            activeAds: 0
        };

        Object.values(this.ads).forEach(ad => {
            if (ad.type === 'html') stats.htmlAds++;
            if (ad.type === 'google') stats.googleAds++;
            
            stats.totalViews += ad.views || 0;
            stats.totalClicks += ad.clicks || 0;
            
            if (ad.content || (ad.client && ad.slot)) {
                stats.activeAds++;
            }
        });

        return stats;
    }

    // Reklam performans raporu
    getPerformanceReport() {
        const report = Object.entries(this.ads).map(([id, ad]) => ({
            id,
            name: ad.name || 'Adsız',
            type: ad.type,
            views: ad.views || 0,
            clicks: ad.clicks || 0,
            ctr: ad.views > 0 ? ((ad.clicks || 0) / ad.views * 100).toFixed(2) + '%' : '0%',
            created: ad.created ? new Date(ad.created).toLocaleDateString('tr-TR') : 'Bilinmiyor',
            lastViewed: ad.lastViewed ? new Date(ad.lastViewed).toLocaleDateString('tr-TR') : 'Hiç',
            width: ad.width || 'Auto',
            height: ad.height || 'Auto'
        }));

        return report.sort((a, b) => b.views - a.views);
    }
}

// Admin Panel Sınıfı
class AdManagerPanel {
    constructor(adManager) {
        this.adManager = adManager;
    }

    openPanel() {
        if (!window.adminAuth || !window.adminAuth.checkAdminStatus()) {
            if (window.adminAuth) {
                window.adminAuth.showLoginModal();
            } else {
                alert('Bu işlem için admin yetkilendirmesi gerekli');
            }
            return;
        }

        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        const stats = this.adManager.getStats();
        const report = this.adManager.getPerformanceReport();
        const sizesReport = this.adManager.getAdSizesReport();

        panel.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                border: 2px solid #00ff88;
            ">
                <h2 style="color: #00ff88; margin-bottom: 20px; text-align: center;">
                    👑 Admin Reklam Paneli
                </h2>
                
                <!-- İstatistikler -->
                <div style="background: rgba(0, 255, 136, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">📊 Genel İstatistikler</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 14px;">
                        <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #00ff88;">${stats.totalAds}</div>
                            <div>Toplam Reklam</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #3498db;">${stats.htmlAds}</div>
                            <div>HTML Reklamı</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${stats.googleAds}</div>
                            <div>Google Ads</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${stats.totalViews}</div>
                            <div>Toplam Görüntülenme</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #9b59b6;">${stats.totalClicks}</div>
                            <div>Toplam Tıklama</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${stats.activeAds}</div>
                            <div>Aktif Reklam</div>
                        </div>
                    </div>
                </div>

                <!-- Reklam Boyutları Raporu -->
                ${sizesReport.length > 0 ? `
                <div style="background: rgba(52, 152, 219, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(52, 152, 219, 0.3);">
                    <h3 style="color: #3498db; margin-bottom: 15px;">📐 Reklam Boyutları</h3>
                    <div style="max-height: 150px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: rgba(52, 152, 219, 0.2);">
                                    <th style="padding: 8px; text-align: left; border: 1px solid rgba(255,255,255,0.1);">Reklam</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Tür</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Boyut</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Preset</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sizesReport.map(ad => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                        <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">${ad.name}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                                            <span style="background: ${ad.type === 'html' ? '#3498db' : '#e74c3c'}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                                                ${ad.type ? ad.type.toUpperCase() : 'N/A'}
                                            </span>
                                        </td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">${ad.width}x${ad.height}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">${ad.preset}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <!-- Performans Raporu -->
                ${report.length > 0 ? `
                <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">📈 Performans Raporu</h3>
                    <div style="max-height: 200px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: rgba(0, 255, 136, 0.2);">
                                    <th style="padding: 8px; text-align: left; border: 1px solid rgba(255,255,255,0.1);">Reklam</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Tür</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Görüntülenme</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Tıklama</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">CTR</th>
                                    <th style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">Son Görüntüleme</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.map(ad => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                        <td style="padding: 8px; border: 1px solid rgba(255,255,255,0.1);">${ad.name}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                                            <span style="background: ${ad.type === 'html' ? '#3498db' : '#e74c3c'}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                                                ${ad.type ? ad.type.toUpperCase() : 'N/A'}
                                            </span>
                                        </td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">${ad.views}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">${ad.clicks}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">${ad.ctr}</td>
                                        <td style="padding: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">${ad.lastViewed}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
                
                <!-- Yönetim Butonları -->
                <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                    <button onclick="adManagerPanel.exportData()" style="
                        background: #3498db; color: white; border: none; padding: 12px; 
                        border-radius: 8px; cursor: pointer; font-weight: bold;
                    ">
                        📁 Reklam Verilerini Dışa Aktar
                    </button>
                    
                    <div>
                        <input type="file" id="importFile" accept=".json" style="display: none;" 
                               onchange="adManagerPanel.importData(this.files[0])">
                        <button onclick="document.getElementById('importFile').click()" style="
                            background: #f39c12; color: white; border: none; padding: 12px; 
                            border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold;
                        ">
                            📤 Reklam Verilerini İçe Aktar
                        </button>
                    </div>
                    
                    <button onclick="adManagerPanel.clearAllStats()" style="
                        background: #e74c3c; color: white; border: none; padding: 12px; 
                        border-radius: 8px; cursor: pointer; font-weight: bold;
                    ">
                        🗑️ Tüm İstatistikleri Temizle
                    </button>
                    
                    <button onclick="adManagerPanel.resetAllAds()" style="
                        background: #c0392b; color: white; border: none; padding: 12px; 
                        border-radius: 8px; cursor: pointer; font-weight: bold;
                    ">
                        ⚠️ Tüm Reklamları Sıfırla
                    </button>
                </div>
                
                <!-- Kullanım Bilgileri -->
                <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(52, 152, 219, 0.3);">
                    <h4 style="color: #3498db; margin-bottom: 10px;">💡 Kullanım İpuçları</h4>
                    <ul style="font-size: 13px; margin-left: 20px; line-height: 1.5;">
                        <li>Reklam alanlarına tıklayarak düzenleyebilirsiniz</li>
                        <li>HTML reklamlarında güvenli kod kullanın</li>
                        <li>Google Ads için geçerli Publisher ID gereklidir</li>
                        <li>Reklam boyutları Google AdSense standartlarına uygundur</li>
                        <li>İstatistikler otomatik olarak kaydedilir</li>
                        <li>Ctrl+Shift+A ile bu paneli açabilirsiniz</li>
                    </ul>
                </div>
                
                <div style="text-align: center; border-top: 2px solid #34495e; padding-top: 15px;">
                    <button onclick="document.body.removeChild(this.closest('div[style*=\"position: fixed\"]'))" style="
                        background: #95a5a6; color: white; border: none; padding: 12px 25px; 
                        border-radius: 25px; cursor: pointer; font-weight: bold;
                    ">
                        ❌ Paneli Kapat
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // ESC tuşu ile kapatma
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(panel);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    exportData() {
        this.adManager.exportAds();
    }

    importData(file) {
        if (file) {
            this.adManager.importAds(file);
        }
    }

    clearAllStats() {
        if (confirm('Tüm reklam istatistiklerini temizlemek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!')) {
            Object.keys(this.adManager.ads).forEach(adId => {
                if (this.adManager.ads[adId]) {
                    this.adManager.ads[adId].views = 0;
                    this.adManager.ads[adId].clicks = 0;
                    delete this.adManager.ads[adId].lastViewed;
                }
            });
            
            this.adManager.saveAds();
            this.adManager.showNotification('📊 Tüm istatistikler temizlendi', 'success');
            
            // Paneli yenile
            document.body.removeChild(document.querySelector('div[style*="position: fixed"]'));
            setTimeout(() => this.openPanel(), 100);
        }
    }

    resetAllAds() {
        if (confirm('TÜM REKLAMLARI SİLMEK istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAMAZ!')) {
            if (confirm('Son uyarı: Bu işlem tüm reklam verilerini kalıcı olarak silecektir!\n\nDevam etmek istediğinizden EMİN MİSİNİZ?')) {
                this.adManager.ads = {};
                this.adManager.saveAds();
                this.adManager.showNotification('⚠️ Tüm reklamlar silindi', 'error');
                
                // Sayfayı yenile
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        }
    }
}

// Global değişkenler
let adManager;
let adManagerPanel;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', function() {
    try {
        adManager = new AdManager();
        adManagerPanel = new AdManagerPanel(adManager);
        
        // Global erişim için
        window.adManager = adManager;
        window.adManagerPanel = adManagerPanel;
        
        console.log('🎯 Ad Manager yüklendi (HTML/JS + Google Ads)');
        console.log('📊 Stats:', adManager.getStats());
    } catch (error) {
        console.error('Ad Manager yüklenirken hata:', error);
    }
});

// Klavye kısayolu (Ctrl+Shift+A)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (adManagerPanel) {
            adManagerPanel.openPanel();
        }
    }
});

// Hata yakalama
window.addEventListener('error', function(e) {
    if (e.error && e.error.message && e.error.message.includes('adsbygoogle')) {
        console.warn('Google Ads yükleme hatası:', e.error.message);
    }
});

// Performance monitoring
if (typeof performance !== 'undefined') {
    window.addEventListener('load', function() {
        setTimeout(() => {
            console.log('🎯 Ad Manager load time:', performance.now().toFixed(2) + 'ms');
        }, 100);
    });
}