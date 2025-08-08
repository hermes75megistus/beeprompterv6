// mobile/script.js - Orijinal mobil uygulama JavaScript'i

// Global değişkenler
let isPlaying = false;
let controlsVisible = false;
let hiddenMode = false;
let currentSpeed = 50;
let animationId = null;
let textHeight = 0;
let animationStartTime = null;
let totalPausedTime = 0;
let lastPauseTime = null;
let currentScrollPosition = 0;
let isMirrored = false;
let manualPosition = null;
let isDragging = false;

const scrollingText = document.getElementById('scrollingText');
const textInput = document.getElementById('textInput');
const speedRange = document.getElementById('speedRange');
const touchFeedback = document.getElementById('touchFeedback');

// Touch eventi değişkenleri
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchMoved = false;

// Ana sayfaya dönüş fonksiyonu
function goHome() {
    if (confirm('Ana sayfaya dönmek istediğinizden emin misiniz?')) {
        window.location.href = '../';
    }
}

// Geliştirilmiş animasyon sistemi - Sürekli akış
function animate(timestamp) {
    if (!animationStartTime) {
        animationStartTime = timestamp;
        if (currentScrollPosition !== 0) {
            const totalDistance = window.innerHeight + textHeight;
            const currentProgress = (window.innerHeight - currentScrollPosition) / totalDistance;
            const effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
            const timeToCurrentPosition = (currentProgress * totalDistance / effectiveSpeed) * 1000;
            totalPausedTime = -timeToCurrentPosition;
        }
    }
    
    // Geçen süreyi hesapla
    const elapsedTime = timestamp - animationStartTime - totalPausedTime;
    
    // Hız 0 ise maksimum hız kullan (500 px/s)
    const effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
    
    // Mevcut pozisyonu hesapla
    const totalDistance = window.innerHeight + textHeight;
    const progress = (elapsedTime * effectiveSpeed / 1000) / totalDistance;
    
    // Pozisyonu güncelle (döngüsel)
    const cyclicProgress = progress % 1;
    currentScrollPosition = window.innerHeight - (cyclicProgress * totalDistance);
    
    // Transform uygula
    scrollingText.style.transform = isMirrored 
        ? `scaleX(-1) translateX(50%) translateY(${currentScrollPosition - window.innerHeight}px)`
        : `translateX(-50%) translateY(${currentScrollPosition - window.innerHeight}px)`;
    scrollingText.style.top = window.innerHeight + 'px';
    
    if (isPlaying) {
        animationId = requestAnimationFrame(animate);
    }
}

function updateTextDimensions() {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontSize = getComputedStyle(scrollingText).fontSize;
    tempDiv.style.fontFamily = getComputedStyle(scrollingText).fontFamily;
    tempDiv.style.fontWeight = getComputedStyle(scrollingText).fontWeight;
    tempDiv.style.width = '90%';
    tempDiv.style.textAlign = 'center';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.wordBreak = 'break-word';
    tempDiv.style.padding = '20px';
    tempDiv.textContent = scrollingText.textContent;
    
    document.body.appendChild(tempDiv);
    textHeight = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
}

function showFeedback(message, duration = 1000) {
    touchFeedback.textContent = message;
    touchFeedback.classList.add('show');
    setTimeout(() => {
        touchFeedback.classList.remove('show');
    }, duration);
}

function showStatus(message, duration = 3000) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.classList.add('show');
    setTimeout(() => {
        status.classList.remove('show');
    }, duration);
}

function updateMirror() {
    const mirrorCheckbox = document.getElementById('mirrorCheckbox');
    const topMirrorBtn = document.getElementById('topMirrorBtn');
    const mirrorBtn = document.getElementById('mirrorBtn');
    
    isMirrored = mirrorCheckbox.checked;
    
    // Buton görünümlerini güncelle
    if (isMirrored) {
        topMirrorBtn.classList.add('mirror-active');
        mirrorBtn.classList.add('active');
        mirrorBtn.textContent = '🪞 Ayna ✓';
    } else {
        topMirrorBtn.classList.remove('mirror-active');
        mirrorBtn.classList.remove('active');
        mirrorBtn.textContent = '🪞 Ayna';
    }
    
    if (isPlaying) {
        scrollingText.style.transform = isMirrored 
            ? `scaleX(-1) translateX(50%) translateY(${currentScrollPosition - window.innerHeight}px)`
            : `translateX(-50%) translateY(${currentScrollPosition - window.innerHeight}px)`;
    } else {
        if (isMirrored) {
            scrollingText.classList.add('mirrored');
        } else {
            scrollingText.classList.remove('mirrored');
        }
    }
}

// Üst kontrol alanından ayna toggle
function toggleMirrorFromTop() {
    const mirrorCheckbox = document.getElementById('mirrorCheckbox');
    mirrorCheckbox.checked = !mirrorCheckbox.checked;
    updateMirror();
    showFeedback(isMirrored ? 'Ayna Açık' : 'Ayna Kapalı');
}

// Kontrol alanından ayna toggle
function toggleMirrorFromControls() {
    const mirrorCheckbox = document.getElementById('mirrorCheckbox');
    mirrorCheckbox.checked = !mirrorCheckbox.checked;
    updateMirror();
}

function toggleControls() {
    controlsVisible = !controlsVisible;
    const controls = document.getElementById('controls');
    const toggleBtn = document.getElementById('toggleBtn');
    const topControls = document.getElementById('topControls');
    
    if (controlsVisible) {
        controls.style.display = 'block';
        setTimeout(() => controls.classList.add('visible'), 10);
    } else {
        controls.classList.remove('visible');
        setTimeout(() => controls.style.display = 'none', 300);
    }
    
    toggleBtn.classList.toggle('visible', controlsVisible);
    topControls.classList.toggle('hidden', controlsVisible);
}

async function pasteFromClipboard() {
    const pasteArea = document.getElementById('pasteArea');
    
    try {
        pasteArea.classList.add('pasting');
        pasteArea.innerHTML = '<div>📋 Yapıştırılıyor...</div>';
        
        const text = await navigator.clipboard.readText();
        
        if (text.trim()) {
            textInput.value = text;
            updateText();
            pasteArea.innerHTML = '<div>✅ Metin yapıştırıldı!</div>';
            showStatus('Metin paneden yapıştırıldı');
        } else {
            pasteArea.innerHTML = '<div>❌ Panoda metin bulunamadı</div>';
        }
        
        setTimeout(() => {
            pasteArea.classList.remove('pasting');
            pasteArea.innerHTML = '<div>📋 Panodaki metni yapıştır</div><small style="opacity: 0.8;">Dokunarak yapıştır</small>';
        }, 2000);
        
    } catch (err) {
        pasteArea.classList.remove('pasting');
        pasteArea.innerHTML = '<div>❌ Pano erişimi reddedildi</div><small>Manuel olarak yazın</small>';
        setTimeout(() => {
            pasteArea.innerHTML = '<div>📋 Panodaki metni yapıştır</div><small style="opacity: 0.8;">Dokunarak yapıştır</small>';
        }, 3000);
    }
}

function updateText() {
    let text = textInput.value.trim();
    if (!text) {
        text = "Metninizi yükleyin veya yazın...";
    }
    
    text = text.replace(/\s+/g, ' '); 
    scrollingText.textContent = text;
    
    updateTextDimensions();
    showStatus(`Metin güncellendi: ${text.length} karakter`);
}

function clearText() {
    textInput.value = '';
    scrollingText.textContent = 'Metninizi yükleyin veya yazın...';
    updateTextDimensions();
    showStatus('Metin temizlendi');
}

function loadFile() {
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const file = fileInput.files[0];
    
    if (file) {
        showStatus('Dosya yükleniyor...');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let content = e.target.result.trim();
                textInput.value = content; 
                
                let processedContent = content.replace(/\s+/g, ' ');
                scrollingText.textContent = processedContent;
                
                updateTextDimensions();
                
                fileInfo.textContent = `${file.name} (${Math.round(file.size/1024)}KB) - ${processedContent.length} karakter`;
                showStatus(`Dosya yüklendi: ${processedContent.length} karakter`);
            } catch (error) {
                showStatus('Dosya okuma hatası');
                fileInfo.textContent = 'Dosya okunamadı';
            }
        };
        reader.readAsText(file, 'UTF-8');
    }
}

function updateSpeed() {
    const speedValue = document.getElementById('speedValue');
    const speedIndicator = document.getElementById('speedIndicator');
    currentSpeed = parseInt(speedRange.value);
    const displayText = currentSpeed === 0 ? 'MAX' : currentSpeed + ' px/s';
    speedValue.textContent = displayText;
    speedIndicator.textContent = `Hız: ${displayText}`;
    
    if (isPlaying && animationStartTime !== null) {
        const now = performance.now();
        const currentTime = now - animationStartTime - totalPausedTime;
        const oldSpeed = currentSpeed === 0 ? 500 : currentSpeed;
        const effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
        animationStartTime = now - (currentTime * effectiveSpeed / oldSpeed);
    }
}

function updateSize() {
    const sizeRange = document.getElementById('sizeRange');
    const sizeValue = document.getElementById('sizeValue');
    const size = sizeRange.value;
    sizeValue.textContent = size + 'px';
    scrollingText.style.fontSize = size + 'px';
    
    updateTextDimensions();
}

function updateColor() {
    const colorSelect = document.getElementById('colorSelect');
    const color = colorSelect.value;
    
    scrollingText.style.color = color;
    scrollingText.style.textShadow = `0 0 15px ${color}B0`;
}

function togglePlay() {
    const playBtn = document.getElementById('playBtn');
    const topPlayBtn = document.getElementById('topPlayBtn');
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playBtn.textContent = '⏸️ Duraklat';
        topPlayBtn.textContent = '⏸️';
        playBtn.classList.add('active');
        topPlayBtn.classList.add('active');
        showStatus('Oynatılıyor', 1000);
        
        if (lastPauseTime !== null) {
            const pauseDuration = performance.now() - lastPauseTime;
            totalPausedTime += pauseDuration;
            lastPauseTime = null;
        }
        
        animationStartTime = null;
        animationId = requestAnimationFrame(animate);
        
    } else {
        playBtn.textContent = '▶️ Başlat';
        topPlayBtn.textContent = '▶️';
        playBtn.classList.remove('active');
        topPlayBtn.classList.remove('active');
        showStatus('Duraklatıldı', 1000);
        
        lastPauseTime = performance.now();
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
}

function resetPosition() {
    const wasPlaying = isPlaying;
    
    // Tüm zaman değişkenlerini sıfırla
    animationStartTime = null;
    totalPausedTime = 0;
    lastPauseTime = null;
    currentScrollPosition = 0;
    
    // Pozisyonu başa al
    scrollingText.style.top = window.innerHeight + 'px';
    scrollingText.style.transform = isMirrored 
        ? 'scaleX(-1) translateX(50%)' 
        : 'translateX(-50%)';
    manualPosition = null;
    
    showStatus('Başa alındı', 1000);
    
    if (wasPlaying) {
        setTimeout(togglePlay, 100);
    }
}

function toggleHiddenMode() {
    hiddenMode = !hiddenMode;
    document.body.classList.toggle('hidden-mode', hiddenMode);
    
    if (hiddenMode) {
        showStatus('Gizli mod aktif', 2000);
    } else {
        showStatus('Gizli mod kapalı', 1000);
    }
}

// Touch event sistemi - Swipe hız değiştirme kaldırıldı
let touchTimeout = null;
let preventNextTap = false;
let initialTouchPos = null;
let wasPausedByTouch = false;
let wasPlayingBeforeTouch = false;
let lastDragPosition = 0;

document.addEventListener('touchstart', function(e) {
    // Kontrollerde dokunma olaylarını engelle
    if (e.target.closest('.controls') || e.target.closest('.toggle-btn') || e.target.closest('.top-controls')) {
        return;
    }
    
    e.preventDefault();
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    touchMoved = false;
    
    initialTouchPos = {
        x: touchStartX,
        y: touchStartY
    };
    
    // Mevcut pozisyonu kaydet
    lastDragPosition = currentScrollPosition;
    
    // Dokunmada akışı duraklat
    if (isPlaying && !controlsVisible && !hiddenMode) {
        wasPlayingBeforeTouch = true;
        wasPausedByTouch = true;
        // Animasyonu durdur ama UI'ı değiştirme
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        lastPauseTime = performance.now();
    } else {
        wasPlayingBeforeTouch = false;
        wasPausedByTouch = false;
    }
    
    // Uzun basma algılama
    touchTimeout = setTimeout(() => {
        if (!touchMoved) {
            resetPosition();
            showFeedback('Başa Alındı');
            preventNextTap = true;
            wasPausedByTouch = false; // Reset edildiğinde touch pause'u iptal et
        }
    }, 800);
    
    // Metin sürükleme başlatma
    if (!controlsVisible && !hiddenMode) {
        isDragging = true;
    }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;
    const totalDistance = Math.sqrt(diffX * diffX + diffY * diffY);
    
    if (totalDistance > 5) {
        touchMoved = true;
        e.preventDefault();
        
        if (touchTimeout) {
            clearTimeout(touchTimeout);
            touchTimeout = null;
        }
        
        // Metin sürükleme - Touch ile duraklatılmış durumda
        if (isDragging && !controlsVisible && !hiddenMode && Math.abs(diffY) > Math.abs(diffX)) {
            // Son pozisyondan itibaren güncelle
            currentScrollPosition = lastDragPosition + diffY;
            
            // Pozisyonu normalize et (döngüsel)
            const totalDist = window.innerHeight + textHeight;
            while (currentScrollPosition > window.innerHeight) {
                currentScrollPosition -= totalDist;
            }
            while (currentScrollPosition < -textHeight) {
                currentScrollPosition += totalDist;
            }
            
            // Transform uygula
            scrollingText.style.transform = isMirrored 
                ? `scaleX(-1) translateX(50%) translateY(${currentScrollPosition - window.innerHeight}px)`
                : `translateX(-50%) translateY(${currentScrollPosition - window.innerHeight}px)`;
            scrollingText.style.top = window.innerHeight + 'px';
        }
    }
}, { passive: false });

document.addEventListener('touchend', function(e) {
    if (!e.changedTouches[0]) return;
    
    if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
    }
    
    if (e.target.closest('.controls') || e.target.closest('.toggle-btn') || e.target.closest('.top-controls')) {
        isDragging = false;
        wasPausedByTouch = false;
        return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const totalDiffX = initialTouchPos ? touchEndX - initialTouchPos.x : 0;
    const totalDiffY = initialTouchPos ? touchEndY - initialTouchPos.y : 0;
    
    const touchDuration = Date.now() - touchStartTime;
    
    isDragging = false;
    
    // Touch ile duraklatılmışsa devam ettir
    if (wasPausedByTouch && wasPlayingBeforeTouch) {
        wasPausedByTouch = false;
        wasPlayingBeforeTouch = false;
        
        // Animasyon zamanlamasını manuel pozisyona göre yeniden hesapla
        const effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
        const totalDist = window.innerHeight + textHeight;
        const currentProgress = (window.innerHeight - currentScrollPosition) / totalDist;
        const timeToCurrentPosition = (currentProgress * totalDist / effectiveSpeed) * 1000;
        
        // Yeni başlangıç zamanını ayarla
        animationStartTime = performance.now();
        totalPausedTime = -timeToCurrentPosition;
        lastPauseTime = null;
        
        // Animasyonu devam ettir
        animationId = requestAnimationFrame(animate);
    }
    
    if (preventNextTap) {
        preventNextTap = false;
        return;
    }
    
    // Swipe kontrolü - Sadece yatay kaydırma için kontroller
    if (touchDuration < 400 && touchMoved) {
        if (Math.abs(totalDiffX) > 60 && Math.abs(totalDiffX) > Math.abs(totalDiffY) * 1.5) {
            e.preventDefault();
            if (!hiddenMode) {
                toggleControls();
                showFeedback(controlsVisible ? 'Kontroller Açıldı' : 'Kontroller Kapatıldı');
            }
            return;
        }
        // Dikey swipe ile hız değiştirme kaldırıldı
    }
    
    // Basit tek dokunma ile oynat/duraklat
    if (touchDuration < 300 && !touchMoved) {
        e.preventDefault();
        togglePlay();
        showFeedback(isPlaying ? 'Başlatıldı' : 'Duraklatıldı');
    }
    
}, { passive: false });

// Pencere yeniden boyutlandırıldığında
window.addEventListener('resize', function() {
    updateTextDimensions();
    if (!isPlaying) {
        resetPosition();
    }
});

// Sayfa görünürlük değiştiğinde
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isPlaying) {
        togglePlay();
        showStatus('Sayfa gizlendi - oynatma duraklatıldı');
    }
});

// Orientasyon değişikliği
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        updateTextDimensions();
        resetPosition();
        showStatus('Ekran döndürüldü - başa alındı');
    }, 300);
});

// Klavye kısayolları - Hız değiştirme kaldırıldı
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlay();
            break;
        case 'KeyH':
            toggleHiddenMode();
            break;
        case 'KeyC':
            if (!hiddenMode) toggleControls();
            break;
        case 'KeyR':
            resetPosition();
            break;
        case 'KeyM':
            document.getElementById('mirrorCheckbox').checked = !document.getElementById('mirrorCheckbox').checked;
            updateMirror();
            break;
        case 'Escape':
            if (controlsVisible) toggleControls();
            if (hiddenMode) toggleHiddenMode();
            break;
        // ArrowUp ve ArrowDown kısayolları kaldırıldı
    }
});

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', function() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0');
    }
    
    updateTextDimensions();
    resetPosition();
    updateSpeed();
    updateMirror(); // Ayna butonlarının başlangıç durumunu ayarla
    
    showStatus('Oynat/Duraklat: Tek Dokunuş | Başa al: Uzun Basma | Kontrol: Yatay Kaydır', 5000);
});

// Wake Lock API desteği
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            showStatus('Ekran açık tutulacak', 2000);
        }
    } catch (err) {
        console.log('Wake lock desteklenmiyor:', err);
    }
}

// Oynatma başladığında wake lock aktif et
const originalTogglePlay = togglePlay;
togglePlay = function() {
    originalTogglePlay();
    if (isPlaying) {
        requestWakeLock();
    } else if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
};

// Paste event desteği
document.addEventListener('paste', function(e) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (text) {
            textInput.value = text;
            updateText();
            showStatus('Metin yapıştırıldı');
        }
    }
}); 
