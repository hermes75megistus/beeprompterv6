// desktop/script.js - Simple Infinite Scroll Like Mobile

// Global variables
let isPlaying = false;
let currentMode = 'vertical'; // 'vertical' or 'horizontal'
let currentSpeed = 50;
let animationId = null;
let textHeight = 0;
let textWidth = 0;
let animationStartTime = null;
let totalPausedTime = 0;
let lastPauseTime = null;
let currentScrollPosition = 0;
let isMirrored = false;
let isFullscreen = false;

const scrollingText = document.getElementById('scrollingText');
const textInput = document.getElementById('textInput');
const speedRange = document.getElementById('speedRange');
const prompterContainer = document.getElementById('prompterContainer');

// Default text constant
const DEFAULT_TEXT = "Beeprompter.com: Deliver Flawless Speeches with Your Free Online Teleprompter! Let your script scroll with you — smooth, professional, and stress-free. Beeprompter is a free, browser-based teleprompter that helps you read scripts naturally during video recordings, live streams, presentations, or speeches. No downloads. No setup. Works instantly on any device!";

function goHome() {
    if (confirm('Are you sure you want to return to the home page?')) {
        window.location.href = '../';
    }
}

function togglePanel() {
    const panel = document.getElementById('controlPanel');
    const btn = document.querySelector('.btn-minimize i');
    panel.classList.toggle('minimized');
    if (panel.classList.contains('minimized')) {
        btn.className = 'fas fa-chevron-right';
        prompterContainer.style.left = '0px';
        prompterContainer.style.right = '0px';
    } else {
        btn.className = 'fas fa-chevron-left';
        const panelWidth = window.innerWidth <= 1024 ? '350px' : '400px';
        const rightSpace = window.innerWidth <= 1024 ? '100px' : '150px';
        prompterContainer.style.left = panelWidth;
        prompterContainer.style.right = rightSpace;
    }
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('verticalBtn').classList.toggle('active', mode === 'vertical');
    document.getElementById('horizontalBtn').classList.toggle('active', mode === 'horizontal');
    scrollingText.className = mode === 'vertical' ? 'scrolling-text vertical-text' : 'scrolling-text horizontal-text';
    if (isMirrored) {
        scrollingText.classList.add('mirrored');
    }
    document.getElementById('modeIndicator').textContent = mode === 'vertical' ? 'Vertical Mode' : 'Horizontal Mode';
    
    updateTextDimensions();
    resetPosition();
    showStatus(`${mode === 'vertical' ? 'Vertical' : 'Horizontal'} Mode active`, 1500);
}

function updateTextDimensions() {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontSize = getComputedStyle(scrollingText).fontSize;
    tempDiv.style.fontFamily = getComputedStyle(scrollingText).fontFamily;
    tempDiv.style.fontWeight = getComputedStyle(scrollingText).fontWeight;
    tempDiv.style.lineHeight = getComputedStyle(scrollingText).lineHeight;
    
    if (currentMode === 'vertical') {
        tempDiv.style.width = '90%';
        tempDiv.style.textAlign = 'center';
        tempDiv.style.whiteSpace = 'normal';
        tempDiv.style.wordBreak = 'break-word';
        tempDiv.style.padding = '0 20px';
        tempDiv.textContent = scrollingText.textContent;
    } else {
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.padding = '20px 0';
        tempDiv.textContent = scrollingText.textContent;
    }
    
    document.body.appendChild(tempDiv);
    textHeight = tempDiv.offsetHeight;
    textWidth = tempDiv.offsetWidth;
    document.body.removeChild(tempDiv);
}

// MOBILE GİBİ BASİT INFINITE SCROLL
function animate(timestamp) {
    if (!isPlaying) return;

    if (!animationStartTime) {
        animationStartTime = timestamp;
        // Eğer mevcut pozisyon varsa (pause'dan devam)
        if (currentScrollPosition !== 0) {
            const containerSize = currentMode === 'vertical' ? prompterContainer.offsetHeight : prompterContainer.offsetWidth;
            const textSize = currentMode === 'vertical' ? textHeight : textWidth;
            const totalDistance = containerSize + textSize;
            const currentProgress = (containerSize - currentScrollPosition) / totalDistance;
            const effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
            const timeToCurrentPosition = (currentProgress * totalDistance / effectiveSpeed) * 1000;
            totalPausedTime = -timeToCurrentPosition;
        }
    }
    
    const elapsedTime = timestamp - animationStartTime - totalPausedTime;
    const effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
    
    if (currentMode === 'vertical') {
        const containerHeight = prompterContainer.offsetHeight;
        const totalDistance = containerHeight + textHeight;
        const distance = (elapsedTime * effectiveSpeed / 1000);
        
        // INFINITE LOOP - Mobile'deki gibi
        const progress = distance % totalDistance;
        currentScrollPosition = containerHeight - progress;
        
        scrollingText.style.transform = isMirrored 
            ? `scaleX(-1) translateX(50%) translateY(${currentScrollPosition - containerHeight}px)`
            : `translateX(-50%) translateY(${currentScrollPosition - containerHeight}px)`;
        scrollingText.style.top = containerHeight + 'px';
        
    } else { // horizontal
        const containerWidth = prompterContainer.offsetWidth;
        const totalDistance = containerWidth + textWidth;
        const distance = (elapsedTime * effectiveSpeed / 1000);
        
        // INFINITE LOOP - Mobile'deki gibi
        const progress = distance % totalDistance;
        currentScrollPosition = containerWidth - progress;
        
        scrollingText.style.transform = isMirrored 
            ? `scaleX(-1) translateY(-50%) translateX(${currentScrollPosition - containerWidth}px)`
            : `translateY(-50%) translateX(${currentScrollPosition - containerWidth}px)`;
        scrollingText.style.left = containerWidth + 'px';
    }
    
    if (isPlaying) {
        animationId = requestAnimationFrame(animate);
    }
}

function updateText() {
    let text = textInput.value.trim();
    if (!text) {
        text = DEFAULT_TEXT;
    }
    scrollingText.textContent = text;
    updateTextDimensions();
    resetPosition();
    showStatus(`Text updated: ${text.length} characters`);
}

function clearText() {
    textInput.value = '';
    updateText();
    showStatus('Text cleared');
}

async function pasteFromClipboard() {
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text.trim()) {
                textInput.value = text;
                updateText();
                showStatus('Text pasted from clipboard');
            } else {
                showStatus('No text found in clipboard');
            }
        } else {
            showStatus('Please use Ctrl+V to paste text manually');
            textInput.focus();
        }
    } catch (err) {
        showStatus('Clipboard access denied. Use Ctrl+V to paste manually');
        textInput.focus();
    }
}

function loadFile() {
    const file = document.getElementById('fileInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            textInput.value = e.target.result.trim();
            updateText();
            document.getElementById('fileInfo').textContent = `${file.name} (${(file.size/1024).toFixed(1)}KB)`;
            showStatus('File loaded');
        };
        reader.readAsText(file, 'UTF-8');
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('playBtn');

    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        playBtn.classList.add('playing');
        showStatus('Playing', 1000);
        
        if (lastPauseTime !== null) {
            const pauseDuration = performance.now() - lastPauseTime;
            totalPausedTime += pauseDuration;
            lastPauseTime = null;
        }
        
        animationStartTime = null;
        animationId = requestAnimationFrame(animate);
        
    } else {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        playBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        playBtn.classList.remove('playing');
        showStatus('Paused', 1000);
        lastPauseTime = performance.now();
    }
}

function resetPosition() {
    isPlaying = false;
    animationStartTime = null;
    totalPausedTime = 0;
    lastPauseTime = null;
    currentScrollPosition = 0;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const playBtn = document.getElementById('playBtn');
    playBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    playBtn.classList.remove('playing');
    
    if (currentMode === 'vertical') {
        scrollingText.style.top = prompterContainer.offsetHeight + 'px';
        scrollingText.style.transform = isMirrored 
            ? 'scaleX(-1) translateX(50%)' 
            : 'translateX(-50%)';
    } else {
        scrollingText.style.left = prompterContainer.offsetWidth + 'px';
        scrollingText.style.transform = isMirrored 
            ? 'scaleX(-1) translateY(-50%)' 
            : 'translateY(-50%)';
    }
    
    showStatus('Reset to beginning', 1000);
}

// Infinite toggle butonu kaldırıldı - sadece görsel olarak gizle
function toggleInfiniteScroll() {
    // Hiçbir şey yapma - her zaman infinite
    showStatus('Always infinite scroll mode', 1500);
}

function updateSpeed() {
    currentSpeed = parseInt(speedRange.value);
    document.getElementById('speedValue').textContent = currentSpeed;
    document.getElementById('speedIndicator').textContent = `Speed: ${currentSpeed} px/s`;
}

function setSpeed(speed) {
    speedRange.value = speed;
    updateSpeed();
    showStatus(`Speed: ${speed} px/s`, 1000);
}

function updateSize() {
    const size = document.getElementById('sizeRange').value;
    document.getElementById('sizeValue').textContent = size + 'px';
    scrollingText.style.fontSize = size + 'px';
    if (currentMode === 'horizontal') {
        scrollingText.style.fontSize = (parseInt(size) + 16) + 'px';
    }
    updateTextDimensions();
    resetPosition();
}

function updateColor() {
    const color = document.getElementById('colorSelect').value;
    scrollingText.style.color = color;
    updateShadow();
}

function updateBackground() {
    prompterContainer.style.background = document.getElementById('backgroundSelect').value;
}

function updateMirror() {
    isMirrored = document.getElementById('mirrorCheckbox').checked;
    scrollingText.classList.toggle('mirrored', isMirrored);
    showStatus(`Mirror mode ${isMirrored ? 'on' : 'off'}`, 1000);
    resetPosition();
}

function updateBold() {
    scrollingText.style.fontWeight = document.getElementById('boldCheckbox').checked ? 'bold' : 'normal';
}

function updateShadow() {
    const shadowCheckbox = document.getElementById('shadowCheckbox');
    const color = scrollingText.style.color || '#00ff88';
    scrollingText.style.textShadow = shadowCheckbox.checked ? `0 0 20px ${color}CC, 0 0 40px ${color}88` : 'none';
}

function toggleFullscreen() {
    const docEl = document.documentElement;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => console.error(err));
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    document.body.classList.toggle('fullscreen', isFullscreen);
    document.querySelector('.btn-fullscreen').innerHTML = isFullscreen
        ? '<i class="fas fa-compress"></i><span>Exit</span>'
        : '<i class="fas fa-expand"></i><span>Fullscreen</span>';
    setTimeout(() => {
        updateTextDimensions();
        resetPosition();
    }, 100);
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

function showStatus(message, duration = 2000) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.opacity = '1';
    setTimeout(() => { status.style.opacity = '0'; }, duration);
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlay();
            break;
        case 'r':
        case 'R':
            resetPosition();
            break;
        case 'f':
        case 'F':
            toggleFullscreen();
            break;
        case 'v':
        case 'V':
            setMode('vertical');
            break;
        case 'h':
        case 'H':
            setMode('horizontal');
            break;
        case 'i':
        case 'I':
            toggleInfiniteScroll();
            break;
        case 'ArrowUp':
            e.preventDefault();
            setSpeed(Math.min(500, currentSpeed + 10));
            break;
        case 'ArrowDown':
            e.preventDefault();
            setSpeed(Math.max(10, currentSpeed - 10));
            break;
        case 'Escape':
            if (isFullscreen) toggleFullscreen();
            break;
    }
});

window.addEventListener('resize', () => {
    updateTextDimensions();
    resetPosition();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPlaying) {
        togglePlay();
    }
});

function initializeApp() {
    if (!textInput.value.trim()) {
        textInput.value = DEFAULT_TEXT;
    }
    
    resetPosition();
    updateSpeed();
    updateSize();
    updateColor();
    updateBackground();
    updateBold();
    updateShadow();
    updateText();
    
    // Infinite butonu görsel olarak aktif yap
    const infiniteBtn = document.getElementById('infiniteBtn');
    if (infiniteBtn) {
        infiniteBtn.classList.add('active');
        infiniteBtn.innerHTML = '<i class="fas fa-infinity"></i><span>Infinite ✓</span>';
    }
    
    setTimeout(() => {
        updateTextDimensions();
        resetPosition();
    }, 100);
    
    showStatus('Ready - Infinite scroll always active', 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

window.addEventListener('load', () => {
    setTimeout(initializeApp, 50);
});

document.addEventListener('paste', (e) => {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        let text = '';
        if (e.clipboardData) {
            text = e.clipboardData.getData('text/plain');
        } else if (window.clipboardData) {
            text = window.clipboardData.getData('Text');
        }
        if (text) {
            textInput.value = text;
            updateText();
            showStatus('Text pasted');
        }
    }
});

console.log('🎯 Desktop Prompter: Simple infinite scroll like mobile')
