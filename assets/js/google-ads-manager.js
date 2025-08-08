// assets/js/google-ads-manager.js - Google Ads Entegrasyon Sistemi

class GoogleAdsManager {
    constructor() {
        this.googleAdsConfig = this.loadGoogleAdsConfig();
        this.isGoogleAdsEnabled = false;
        this.adSensePublisherId = null;
        this.adUnits = {};
        this.initializeGoogleAds();
    }

    // Google Ads yapılandırmasını yükle
    loadGoogleAdsConfig() {
        try {
            const config = localStorage.getItem('google_ads_config');
            return config ? JSON.parse(config) : {
                publisherId: '',
                adUnits: {},
                enabled: false,
                testMode: true,
                autoAds: false
            };
        } catch (error) {
            console.error('Google Ads config yüklenirken hata:', error);
            return { enabled: false };
        }
    }

    // Google Ads yapılandırmasını kaydet
    saveGoogleAdsConfig() {
        try {
            localStorage.setItem('google_ads_config', JSON.stringify(this.googleAdsConfig));
        } catch (error) {
            console.error('Google Ads config kaydedilirken hata:', error);
        }
    }

    // Google Ads'i başlat
    initializeGoogleAds() {
        if (!this.googleAdsConfig.enabled || !this.googleAdsConfig.publisherId) {
            console.log('Google Ads devre dışı veya Publisher ID bulunamadı');
            return;
        }

        this.adSensePublisherId = this.googleAdsConfig.publisherId;
        this.loadGoogleAdsScript();
    }

    // Google AdSense script'ini yükle
    loadGoogleAdsScript() {
        // Zaten yüklü mü kontrol et
        if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
            this.onGoogleAdsLoaded();
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adSensePublisherId}`;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
            this.onGoogleAdsLoaded();
        };
        
        script.onerror = () => {
            console.error('Google Ads script yüklenemedi');
            this.showNotification('Google Ads yüklenemedi', 'error');
        };
        
        document.head.appendChild(script);

        // Auto Ads etkinse
        if (this.googleAdsConfig.autoAds) {
            this.enableAutoAds();
        }
    }

    // Google Ads yüklendiğinde
    onGoogleAdsLoaded() {
        this.isGoogleAdsEnabled = true;
        console.log('✅ Google Ads başarıyla yüklendi');
        
        // Test modunda uyarı
        if (this.googleAdsConfig.testMode) {
            console.warn('⚠️ Google Ads test modunda çalışıyor');
        }

        // Mevcut ad unit'leri render et
        this.renderExistingAdUnits();
    }

    // Auto Ads'i etkinleştir
    enableAutoAds() {
        const autoScript = document.createElement('script');
        autoScript.innerHTML = `
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "${this.adSensePublisherId}",
                enable_page_level_ads: true
            });
        `;
        document.head.appendChild(autoScript);
    }

    // Mevcut ad unit'leri render et
    renderExistingAdUnits() {
        Object.keys(this.googleAdsConfig.adUnits).forEach(adId => {
            const placeholder = document.querySelector(`[data-ad-id="${adId}"]`);
            if (placeholder) {
                this.renderGoogleAd(placeholder, this.googleAdsConfig.adUnits[adId]);
            }
        });
    }

    // Google Ad render et
    renderGoogleAd(placeholder, adConfig) {
        if (!this.isGoogleAdsEnabled) {
            console.warn('Google Ads henüz yüklenmedi');
            return;
        }

        // Placeholder'ı temizle
        placeholder.innerHTML = '';
        
        // AdSense ad container oluştur
        const adContainer = document.createElement('ins');
        adContainer.className = 'adsbygoogle';
        adContainer.style.display = 'block';
        
        // Ad unit yapılandırması
        if (adConfig.type === 'display') {
            adContainer.setAttribute('data-ad-client', this.adSensePublisherId);
            adContainer.setAttribute('data-ad-slot', adConfig.adSlot);
            if (adConfig.width && adConfig.height) {
                adContainer.style.width = adConfig.width + 'px';
                adContainer.style.height = adConfig.height + 'px';
                adContainer.setAttribute('data-ad-format', 'rectangle');
            } else {
                adContainer.setAttribute('data-ad-format', 'auto');
                adContainer.setAttribute('data-full-width-responsive', 'true');
            }
        } else if (adConfig.type === 'inarticle') {
            adContainer.setAttribute('data-ad-client', this.adSensePublisherId);
            adContainer.setAttribute('data-ad-slot', adConfig.adSlot);
            adContainer.setAttribute('data-ad-format', 'fluid');
            adContainer.setAttribute('data-ad-layout-key', adConfig.layoutKey || '-6t+ed+2i-1n-4w');
        } else if (adConfig.type === 'multiplex') {
            adContainer.setAttribute('data-ad-client', this.adSensePublisherId);
            adContainer.setAttribute('data-ad-slot', adConfig.adSlot);
            adContainer.setAttribute('data-ad-format', 'autorelaxed');
        }

        // Test modunda data-adtest ekle
        if (this.googleAdsConfig.testMode) {
            adContainer.setAttribute('data-adtest', 'on');
        }

        placeholder.appendChild(adContainer);

        try {
            // AdSense'i başlat
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log(`✅ Google Ad render edildi: ${adConfig.name}`);
        } catch (error) {
            console.error('Google Ad render hatası:', error);
            this.showAdError(placeholder, 'Reklam yüklenemedi');
        }
    }

    // Ad error göster
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
                <small>Lütfen ad konfigürasyonunu kontrol edin</small>
            </div>
        `;
    }

    // Google Ads yapılandırma editörü
    showGoogleAdsEditor() {
        // Admin kontrolü
        if (!window.adminAuth || !window.adminAuth.checkAdminStatus()) {
            console.warn('🚫 Google Ads ayarlarına erişim reddedildi');
            window.adminAuth.showLoginModal();
            return;
        }

        const modal = document.createElement('div');
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
            z-index: 25000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                border: 2px solid #4285f4;
            ">
                <h2 style="color: #4285f4; margin-bottom: 20px; text-align: center;">
                    <i class="fab fa-google"></i> Google Ads Yapılandırması
                </h2>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #4285f4;">
                        <i class="fas fa-toggle-on"></i> Google Ads Durumu:
                    </label>
                    <div style="display: flex; gap: 15px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="adsEnabled" value="true" ${this.googleAdsConfig.enabled ? 'checked' : ''}>
                            <span>Etkin</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="adsEnabled" value="false" ${!this.googleAdsConfig.enabled ? 'checked' : ''}>
                            <span>Devre Dışı</span>
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #4285f4;">
                        <i class="fas fa-id-card"></i> AdSense Publisher ID:
                    </label>
                    <input type="text" id="publisherId" value="${this.googleAdsConfig.publisherId || ''}" 
                           placeholder="ca-pub-1234567890123456" 
                           style="width: 100%; padding: 10px; border: 2px solid #4285f4; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                    <small style="color: #888; display: block; margin-top: 5px;">
                        AdSense hesabınızdan Publisher ID'nizi kopyalayın (ca-pub-... ile başlar)
                    </small>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="testMode" ${this.googleAdsConfig.testMode ? 'checked' : ''}>
                        <span><i class="fas fa-flask"></i> Test Modu (Geliştirme için)</span>
                    </label>
                    <small style="color: #888; display: block; margin-top: 5px; margin-left: 28px;">
                        Test modunda reklamlar gerçek gelir getirmez
                    </small>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="autoAds" ${this.googleAdsConfig.autoAds ? 'checked' : ''}>
                        <span><i class="fas fa-magic"></i> Auto Ads (Otomatik Reklam Yerleştirme)</span>
                    </label>
                    <small style="color: #888; display: block; margin-top: 5px; margin-left: 28px;">
                        Google otomatik olarak en iyi yerlere reklam yerleştirir
                    </small>
                </div>

                <div style="background: rgba(66, 133, 244, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(66, 133, 244, 0.3);">
                    <h4 style="color: #4285f4; margin-bottom: 10px;">📋 Kurulum Adımları</h4>
                    <ol style="color: #ccc; font-size: 13px; padding-left: 20px;">
                        <li>Google AdSense hesabınızı oluşturun</li>
                        <li>Site doğrulamalarını tamamlayın</li>
                        <li>Publisher ID'nizi buraya girin</li>
                        <li>Ad Unit'lerinizi oluşturun</li>
                        <li>Test modunda kontrol edin</li>
                        <li>Canlıya alın</li>
                    </ol>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="googleAdsManager.saveGoogleAdsSettings(this.closest('div[style*=\"position: fixed\"]'))" 
                            style="background: #4285f4; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-save"></i> Kaydet
                    </button>
                    <button onclick="googleAdsManager.testGoogleAds()" 
                            style="background: #34a853; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-play"></i> Test Et
                    </button>
                    <button onclick="document.body.removeChild(this.closest('div[style*=\"position: fixed\"]'))" 
                            style="background: #ea4335; color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-times"></i> İptal
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Google Ads ayarlarını kaydet
    saveGoogleAdsSettings(modal) {
        const enabled = modal.querySelector('input[name="adsEnabled"]:checked').value === 'true';
        const publisherId = modal.querySelector('#publisherId').value.trim();
        const testMode = modal.querySelector('#testMode').checked;
        const autoAds = modal.querySelector('#autoAds').checked;

        // Validation
        if (enabled && !publisherId) {
            this.showNotification('Publisher ID gerekli!', 'error');
            return;
        }

        if (enabled && !publisherId.startsWith('ca-pub-')) {
            this.showNotification('Geçersiz Publisher ID formatı!', 'error');
            return;
        }

        // Ayarları güncelle
        this.googleAdsConfig = {
            enabled,
            publisherId,
            testMode,
            autoAds,
            adUnits: this.googleAdsConfig.adUnits || {}
        };

        this.saveGoogleAdsConfig();
        document.body.removeChild(modal);

        // Google Ads'i yeniden başlat
        if (enabled) {
            this.initializeGoogleAds();
            this.showNotification('Google Ads ayarları kaydedildi ve aktifleştirildi!', 'success');
        } else {
            this.showNotification('Google Ads devre dışı bırakıldı', 'info');
        }

        // Sayfayı yenile (script değişiklikleri için)
        setTimeout(() => {
            if (confirm('Değişikliklerin etkili olması için sayfayı yenilemek gerekir. Şimdi yenilensin mi?')) {
                location.reload();
            }
        }, 1000);
    }

    // Google Ads test et
    testGoogleAds() {
        if (!this.googleAdsConfig.publisherId) {
            this.showNotification('Önce Publisher ID girin!', 'error');
            return;
        }

        // Test ad oluştur
        const testContainer = document.createElement('div');
        testContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            z-index: 26000;
            max-width: 400px;
            width: 90%;
        `;

        testContainer.innerHTML = `
            <h3 style="text-align: center; margin-bottom: 15px; color: #4285f4;">Test Reklamı</h3>
            <ins class="adsbygoogle"
                 style="display:block;width:300px;height:250px;margin:0 auto;"
                 data-ad-client="${this.googleAdsConfig.publisherId}"
                 data-ad-slot="test"
                 data-adtest="on">
            </ins>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="document.body.removeChild(this.parentElement)" 
                        style="background: #ea4335; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                    Kapat
                </button>
            </div>
        `;

        document.body.appendChild(testContainer);

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.showNotification('Test reklamı yüklendi', 'info');
        } catch (error) {
            this.showNotification('Test reklamı yüklenemedi: ' + error.message, 'error');
        }
    }

    // Ad Unit editörü
    showAdUnitEditor(placeholder, adId) {
        // Admin kontrolü
        if (!window.adminAuth || !window.adminAuth.checkAdminStatus()) {
            console.warn('🚫 Ad unit editörüne erişim reddedildi');
            return;
        }

        const currentAdUnit = this.googleAdsConfig.adUnits[adId] || {};

        const modal = document.createElement('div');
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
            z-index: 25000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 100%;
                border: 2px solid #4285f4;
            ">
                <h3 style="color: #4285f4; margin-bottom: 20px; text-align: center;">
                    <i class="fab fa-google"></i> Google Ad Unit Düzenle
                </h3>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #4285f4;">
                        Ad Unit İsmi:
                    </label>
                    <input type="text" id="adUnitName" value="${currentAdUnit.name || ''}" placeholder="Banner Reklamı" 
                           style="width: 100%; padding: 10px; border: 2px solid #4285f4; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #4285f4;">
                        Ad Slot ID:
                    </label>
                    <input type="text" id="adSlot" value="${currentAdUnit.adSlot || ''}" placeholder="1234567890" 
                           style="width: 100%; padding: 10px; border: 2px solid #4285f4; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                    <small style="color: #888; display: block; margin-top: 5px;">
                        AdSense'den aldığınız Ad Slot numarası
                    </small>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #4285f4;">
                        Reklam Türü:
                    </label>
                    <select id="adType" style="width: 100%; padding: 10px; border: 2px solid #4285f4; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        <option value="display" ${currentAdUnit.type === 'display' ? 'selected' : ''}>Display Ad (Banner)</option>
                        <option value="inarticle" ${currentAdUnit.type === 'inarticle' ? 'selected' : ''}>In-article Ad</option>
                        <option value="multiplex" ${currentAdUnit.type === 'multiplex' ? 'selected' : ''}>Multiplex Ad</option>
                    </select>
                </div>

                <div id="sizeFields" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #4285f4;">
                        Boyutlar (opsiyonel):
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="adWidth" value="${currentAdUnit.width || ''}" placeholder="300" 
                               style="flex: 1; padding: 10px; border: 2px solid #4285f4; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                        <span style="display: flex; align-items: center;">x</span>
                        <input type="number" id="adHeight" value="${currentAdUnit.height || ''}" placeholder="250" 
                               style="flex: 1; padding: 10px; border: 2px solid #4285f4; border-radius: 8px; background: rgba(0, 0, 0, 0.7); color: white;">
                    </div>
                    <small style="color: #888; display: block; margin-top: 5px;">
                        Boş bırakırsanız responsive olur
                    </small>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="googleAdsManager.saveAdUnit('${adId}', this.closest('div[style*=\"position: fixed\"]'))" 
                            style="background: #4285f4; color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-save"></i> Kaydet
                    </button>
                    <button onclick="document.body.removeChild(this.closest('div[style*=\"position: fixed\"]'))" 
                            style="background: #ea4335; color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-times"></i> İptal
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Ad Unit kaydet
    saveAdUnit(adId, modal) {
        const name = modal.querySelector('#adUnitName').value.trim();
        const adSlot = modal.querySelector('#adSlot').value.trim();
        const type = modal.querySelector('#adType').value;
        const width = modal.querySelector('#adWidth').value;
        const height = modal.querySelector('#adHeight').value;

        if (!name || !adSlot) {
            this.showNotification('Ad Unit ismi ve Slot ID gerekli!', 'error');
            return;
        }

        // Ad unit kaydet
        this.googleAdsConfig.adUnits[adId] = {
            name,
            adSlot,
            type,
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null
        };

        this.saveGoogleAdsConfig();
        document.body.removeChild(modal);

        // Placeholder'ı güncelle
        const placeholder = document.querySelector(`[data-ad-id="${adId}"]`);
        if (placeholder && this.isGoogleAdsEnabled) {
            this.renderGoogleAd(placeholder, this.googleAdsConfig.adUnits[adId]);
        }

        this.showNotification('Google Ad Unit kaydedildi!', 'success');
    }

    // Bildirim göster
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : '#4285f4'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 30000;
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
        }, 4000);
    }
}

// Global Google Ads Manager instance
window.googleAdsManager = new GoogleAdsManager();

// Konsol mesajı
console.log('%c📊 Google Ads Manager Loaded', 'color: #4285f4; font-weight: bold; font-size: 12px;');
console.log('Google Ads ayarları için: googleAdsManager.showGoogleAdsEditor()');