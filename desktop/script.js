// desktop/script.js - Edge Compatible with Fixed Infinite Scroll

// Global variables
var isPlaying = false;
var currentMode = 'vertical'; // 'vertical' or 'horizontal'
var currentSpeed = 50;
var animationId = null;
var textHeight = 0;
var textWidth = 0;
var animationStartTime = null;
var totalPausedTime = 0;
var lastPauseTime = null;
var currentScrollPosition = 0;
var isMirrored = false;
var isFullscreen = false;
var infiniteScroll = false;

var scrollingText = document.getElementById('scrollingText');
var textInput = document.getElementById('textInput');
var speedRange = document.getElementById('speedRange');
var prompterContainer = document.getElementById('prompterContainer');

// Default text constant
var DEFAULT_TEXT = "Beeprompter.com: Deliver Flawless Speeches with Your Free Online Teleprompter! Let your script scroll with you — smooth, professional, and stress-free. Beeprompter is a free, browser-based teleprompter that helps you read scripts naturally during video recordings, live streams, presentations, or speeches. No downloads. No setup. Works instantly on any device!";

// Polyfills for Edge and older browsers
(function() {
    // requestAnimationFrame polyfill
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || 
                                     window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { 
                callback(currTime + timeToCall); 
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
    
    // performance.now polyfill
    if (!window.performance) {
        window.performance = {};
    }
    
    if (!window.performance.now) {
        var nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart;
        }
        window.performance.now = function() {
            return Date.now() - nowOffset;
        };
    }
})();

function goHome() {
    if (confirm('Are you sure you want to return to the home page?')) {
        window.location.href = '../';
    }
}

function togglePanel() {
    var panel = document.getElementById('controlPanel');
    var btn = document.querySelector('.btn-minimize i');
    
    if (panel.className.indexOf('minimized') > -1) {
        panel.className = panel.className.replace(' minimized', '');
        btn.className = 'fas fa-chevron-left';
        prompterContainer.style.left = '400px';
        prompterContainer.style.right = '150px';
    } else {
        panel.className += ' minimized';
        btn.className = 'fas fa-chevron-right';
        prompterContainer.style.left = '0px';
        prompterContainer.style.right = '0px';
    }
}

function setMode(mode) {
    currentMode = mode;
    var verticalBtn = document.getElementById('verticalBtn');
    var horizontalBtn = document.getElementById('horizontalBtn');
    var modeIndicator = document.getElementById('modeIndicator');
    
    if (mode === 'vertical') {
        verticalBtn.className = 'mode-btn active';
        horizontalBtn.className = 'mode-btn';
        scrollingText.className = 'scrolling-text vertical-text';
        modeIndicator.textContent = 'Vertical Mode';
    } else {
        verticalBtn.className = 'mode-btn';
        horizontalBtn.className = 'mode-btn active';
        scrollingText.className = 'scrolling-text horizontal-text';
        modeIndicator.textContent = 'Horizontal Mode';
    }
    
    if (isMirrored) {
        scrollingText.className += ' mirrored';
    }
    
    updateTextDimensions();
    resetPosition();
    showStatus(mode === 'vertical' ? 'Vertical Mode active' : 'Horizontal Mode active', 1500);
}

function updateTextDimensions() {
    var tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontSize = window.getComputedStyle(scrollingText).fontSize;
    tempDiv.style.fontFamily = window.getComputedStyle(scrollingText).fontFamily;
    tempDiv.style.fontWeight = window.getComputedStyle(scrollingText).fontWeight;
    tempDiv.style.lineHeight = window.getComputedStyle(scrollingText).lineHeight;
    
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

// FIXED ANIMATION - Working Infinite Scroll
function animate(timestamp) {
    if (!isPlaying) return;

    // Initialize timing
    if (!animationStartTime) {
        animationStartTime = timestamp;
        
        // Handle resume from paused position
        if (currentScrollPosition !== 0) {
            var containerSize = currentMode === 'vertical' ? prompterContainer.offsetHeight : prompterContainer.offsetWidth;
            var textSize = currentMode === 'vertical' ? textHeight : textWidth;
            var totalDistance = containerSize + textSize;
            var distanceScrolled = containerSize - currentScrollPosition;
            var effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
            var timeOffset = (distanceScrolled / effectiveSpeed) * 1000;
            animationStartTime = timestamp - timeOffset - totalPausedTime;
        }
    }
    
    // Calculate elapsed time
    var elapsedTime = timestamp - animationStartTime - totalPausedTime;
    
    // Calculate effective speed
    var effectiveSpeed = currentSpeed === 0 ? 500 : currentSpeed;
    
    // Calculate distance
    var distanceTraveled = (elapsedTime / 1000) * effectiveSpeed;
    
    if (currentMode === 'vertical') {
        var containerHeight = prompterContainer.offsetHeight;
        var totalDistance = containerHeight + textHeight;
        
        if (infiniteScroll) {
            // INFINITE SCROLL - Continuous loop
            var progress = distanceTraveled / totalDistance;
            var loops = Math.floor(progress);
            var remainder = progress - loops;
            
            currentScrollPosition = containerHeight - (remainder * totalDistance);
            
            // Apply transform
            var transformValue = 'translateX(-50%) translateY(' + (currentScrollPosition - containerHeight) + 'px)';
            if (isMirrored) {
                transformValue = 'scaleX(-1) translateX(50%) translateY(' + (currentScrollPosition - containerHeight) + 'px)';
            }
            scrollingText.style.transform = transformValue;
            scrollingText.style.msTransform = transformValue;
            scrollingText.style.webkitTransform = transformValue;
            scrollingText.style.top = containerHeight + 'px';
            
        } else {
            // SINGLE SCROLL - Stop at end
            currentScrollPosition = containerHeight - distanceTraveled;
            
            if (currentScrollPosition < -textHeight) {
                // Text completely scrolled out - stop
                stopAnimation();
                showStatus('Text finished - click Reset to restart', 2000);
                return;
            }
            
            // Apply transform
            var transformValue = 'translateX(-50%) translateY(' + (currentScrollPosition - containerHeight) + 'px)';
            if (isMirrored) {
                transformValue = 'scaleX(-1) translateX(50%) translateY(' + (currentScrollPosition - containerHeight) + 'px)';
            }
            scrollingText.style.transform = transformValue;
            scrollingText.style.msTransform = transformValue;
            scrollingText.style.webkitTransform = transformValue;
            scrollingText.style.top = containerHeight + 'px';
        }
        
    } else { // horizontal mode
        var containerWidth = prompterContainer.offsetWidth;
        var totalDistance = containerWidth + textWidth;
        
        if (infiniteScroll) {
            // INFINITE SCROLL - Continuous loop
            var progress = distanceTraveled / totalDistance;
            var loops = Math.floor(progress);
            var remainder = progress - loops;
            
            currentScrollPosition = containerWidth - (remainder * totalDistance);
            
            // Apply transform
            var transformValue = 'translateY(-50%) translateX(' + (currentScrollPosition - containerWidth) + 'px)';
            if (isMirrored) {
                transformValue = 'scaleX(-1) translateY(-50%) translateX(' + (currentScrollPosition - containerWidth) + 'px)';
            }
            scrollingText.style.transform = transformValue;
            scrollingText.style.msTransform = transformValue;
            scrollingText.style.webkitTransform = transformValue;
            scrollingText.style.left = containerWidth + 'px';
            
        } else {
            // SINGLE SCROLL - Stop at end
            currentScrollPosition = containerWidth - distanceTraveled;
            
            if (currentScrollPosition < -textWidth) {
                // Text completely scrolled out - stop
                stopAnimation();
                showStatus('Text finished - click Reset to restart', 2000);
                return;
            }
            
            // Apply transform
            var transformValue = 'translateY(-50%) translateX(' + (currentScrollPosition - containerWidth) + 'px)';
            if (isMirrored) {
                transformValue = 'scaleX(-1) translateY(-50%) translateX(' + (currentScrollPosition - containerWidth) + 'px)';
            }
            scrollingText.style.transform = transformValue;
            scrollingText.style.msTransform = transformValue;
            scrollingText.style.webkitTransform = transformValue;
            scrollingText.style.left = containerWidth + 'px';
        }
    }
    
    // Continue animation
    if (isPlaying) {
        animationId = requestAnimationFrame(animate);
    }
}

function stopAnimation() {
    isPlaying = false;
    animationStartTime = null;
    totalPausedTime = 0;
    lastPauseTime = null;
    
    var playBtn = document.getElementById('playBtn');
    playBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    playBtn.className = playBtn.className.replace(' playing', '');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function updateText() {
    var text = textInput.value.trim();
    if (!text) {
        text = DEFAULT_TEXT;
        textInput.value = DEFAULT_TEXT;
    }
    scrollingText.textContent = text;
    updateTextDimensions();
    resetPosition();
    showStatus('Text updated: ' + text.length + ' characters');
}

function clearText() {
    textInput.value = '';
    scrollingText.textContent = DEFAULT_TEXT;
    updateTextDimensions();
    resetPosition();
    showStatus('Text cleared - using default text');
}

function pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function(text) {
            if (text.trim()) {
                textInput.value = text;
                updateText();
                showStatus('Text pasted from clipboard');
            } else {
                showStatus('No text found in clipboard');
            }
        }).catch(function(err) {
            showStatus('Clipboard access denied. Use Ctrl+V to paste manually');
            textInput.focus();
        });
    } else {
        // Fallback for older browsers
        showStatus('Please use Ctrl+V to paste text manually');
        textInput.focus();
    }
}

function loadFile() {
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];
    
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            textInput.value = e.target.result.trim();
            updateText();
            var fileInfo = document.getElementById('fileInfo');
            fileInfo.textContent = file.name + ' (' + (file.size/1024).toFixed(1) + 'KB)';
            showStatus('File loaded');
        };
        reader.readAsText(file, 'UTF-8');
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    var playBtn = document.getElementById('playBtn');

    if (isPlaying) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        playBtn.className += ' playing';
        showStatus('Playing', 1000);
        
        // Handle resume from pause
        if (lastPauseTime !== null) {
            var pauseDuration = performance.now() - lastPauseTime;
            totalPausedTime += pauseDuration;
            lastPauseTime = null;
        }
        
        // Reset start time
        animationStartTime = null;
        
        // Start animation
        animationId = requestAnimationFrame(animate);
        
    } else {
        playBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        playBtn.className = playBtn.className.replace(' playing', '');
        showStatus('Paused', 1000);
        
        // Record pause time
        lastPauseTime = performance.now();
        
        // Stop animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
}

function resetPosition() {
    // Stop everything
    isPlaying = false;
    animationStartTime = null;
    totalPausedTime = 0;
    lastPauseTime = null;
    currentScrollPosition = 0;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    var playBtn = document.getElementById('playBtn');
    playBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    playBtn.className = playBtn.className.replace(' playing', '');
    
    // Reset position
    if (currentMode === 'vertical') {
        var containerHeight = prompterContainer.offsetHeight;
        scrollingText.style.top = containerHeight + 'px';
        
        var transformValue = 'translateX(-50%)';
        if (isMirrored) {
            transformValue = 'scaleX(-1) translateX(50%)';
        }
        scrollingText.style.transform = transformValue;
        scrollingText.style.msTransform = transformValue;
        scrollingText.style.webkitTransform = transformValue;
    } else {
        var containerWidth = prompterContainer.offsetWidth;
        scrollingText.style.left = containerWidth + 'px';
        
        var transformValue = 'translateY(-50%)';
        if (isMirrored) {
            transformValue = 'scaleX(-1) translateY(-50%)';
        }
        scrollingText.style.transform = transformValue;
        scrollingText.style.msTransform = transformValue;
        scrollingText.style.webkitTransform = transformValue;
    }
    
    showStatus('Reset to beginning', 1000);
}

function toggleInfiniteScroll() {
    infiniteScroll = !infiniteScroll;
    var infiniteBtn = document.getElementById('infiniteBtn');
    
    if (infiniteScroll) {
        infiniteBtn.className += ' active';
        infiniteBtn.innerHTML = '<i class="fas fa-infinity"></i><span>Infinite ✓</span>';
        showStatus('Infinite scroll enabled - text will loop continuously', 2000);
    } else {
        infiniteBtn.className = infiniteBtn.className.replace(' active', '');
        infiniteBtn.innerHTML = '<i class="fas fa-infinity"></i><span>Infinite</span>';
        showStatus('Single scroll mode - text will stop at end', 2000);
    }
    
    resetPosition();
}

function updateSpeed() {
    currentSpeed = parseInt(speedRange.value);
    document.getElementById('speedValue').textContent = currentSpeed;
    document.getElementById('speedIndicator').textContent = 'Speed: ' + currentSpeed + ' px/s';
    
    // Adjust timing if playing
    if (isPlaying && animationStartTime !== null) {
        var now = performance.now();
        var elapsedTime = now - animationStartTime - totalPausedTime;
        var oldSpeed = currentSpeed === 0 ? 500 : currentSpeed;
        var distanceTraveled = (elapsedTime / 1000) * oldSpeed;
        var newSpeed = currentSpeed === 0 ? 500 : currentSpeed;
        animationStartTime = now - (distanceTraveled / newSpeed * 1000) - totalPausedTime;
    }
}

function setSpeed(speed) {
    speedRange.value = speed;
    updateSpeed();
    showStatus('Speed: ' + speed + ' px/s', 1000);
}

function updateSize() {
    var sizeRange = document.getElementById('sizeRange');
    var size = sizeRange.value;
    document.getElementById('sizeValue').textContent = size + 'px';
    scrollingText.style.fontSize = size + 'px';
    
    if (currentMode === 'horizontal') {
        scrollingText.style.fontSize = (parseInt(size) + 16) + 'px';
    }
    
    updateTextDimensions();
    resetPosition();
}

function updateColor() {
    var colorSelect = document.getElementById('colorSelect');
    var color = colorSelect.value;
    scrollingText.style.color = color;
    updateShadow();
}

function updateBackground() {
    var backgroundSelect = document.getElementById('backgroundSelect');
    prompterContainer.style.background = backgroundSelect.value;
}

function updateMirror() {
    var mirrorCheckbox = document.getElementById('mirrorCheckbox');
    isMirrored = mirrorCheckbox.checked;
    
    if (isMirrored) {
        scrollingText.className += ' mirrored';
    } else {
        scrollingText.className = scrollingText.className.replace(' mirrored', '');
    }
    
    showStatus(isMirrored ? 'Mirror mode on' : 'Mirror mode off', 1000);
    
    if (!isPlaying) {
        resetPosition();
    }
}

function updateBold() {
    var boldCheckbox = document.getElementById('boldCheckbox');
    scrollingText.style.fontWeight = boldCheckbox.checked ? 'bold' : 'normal';
}

function updateShadow() {
    var shadowCheckbox = document.getElementById('shadowCheckbox');
    var color = scrollingText.style.color || '#00ff88';
    
    if (shadowCheckbox.checked) {
        var shadowValue = '0 0 20px ' + color + ', 0 0 40px ' + color;
        scrollingText.style.textShadow = shadowValue;
    } else {
        scrollingText.style.textShadow = 'none';
    }
}

function toggleFullscreen() {
    var docEl = document.documentElement;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && !document.msFullscreenElement) {
        
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                     document.mozFullScreenElement || document.msFullscreenElement);
    
    if (isFullscreen) {
        document.body.className += ' fullscreen';
    } else {
        document.body.className = document.body.className.replace(' fullscreen', '');
    }
    
    var fullscreenBtn = document.querySelector('.btn-fullscreen');
    if (isFullscreen) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i><span>Exit</span>';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i><span>Fullscreen</span>';
    }
    
    setTimeout(function() {
        updateTextDimensions();
        resetPosition();
    }, 100);
}

// Fullscreen event listeners
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function showStatus(message, duration) {
    duration = duration || 2000;
    var status = document.getElementById('status');
    status.textContent = message;
    status.style.opacity = '1';
    
    setTimeout(function() {
        status.style.opacity = '0';
    }, duration);
}

// Keyboard event handler
document.addEventListener('keydown', function(e) {
    // Skip if typing in input
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        return;
    }
    
    var key = e.key || String.fromCharCode(e.keyCode);
    var keyCode = e.keyCode || e.which;
    
    // Handle special keys
    switch(keyCode) {
        case 32: // Space
            e.preventDefault();
            togglePlay();
            break;
        case 82: // R
        case 114: // r
            e.preventDefault();
            resetPosition();
            break;
        case 70: // F
        case 102: // f
            e.preventDefault();
            toggleFullscreen();
            break;
        case 86: // V
        case 118: // v
            e.preventDefault();
            setMode('vertical');
            break;
        case 72: // H
        case 104: // h
            e.preventDefault();
            setMode('horizontal');
            break;
        case 73: // I
        case 105: // i
            e.preventDefault();
            toggleInfiniteScroll();
            break;
        case 38: // Arrow Up
            e.preventDefault();
            setSpeed(Math.min(500, currentSpeed + 10));
            break;
        case 40: // Arrow Down
            e.preventDefault();
            setSpeed(Math.max(10, currentSpeed - 10));
            break;
        case 27: // Escape
            if (isFullscreen) {
                e.preventDefault();
                toggleFullscreen();
            }
            break;
    }
});

// Window resize handler
window.addEventListener('resize', function() {
    updateTextDimensions();
    if (!isPlaying) {
        resetPosition();
    }
});

// Visibility change handler
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isPlaying) {
        togglePlay();
    }
});

// Initialize application
function initializeApp() {
    // Set default text
    if (!textInput.value.trim()) {
        textInput.value = DEFAULT_TEXT;
    }
    
    // Initialize all components
    updateText();
    updateSpeed();
    updateSize();
    updateColor();
    updateBackground();
    updateBold();
    updateShadow();
    
    // Set initial position with delay for proper calculation
    setTimeout(function() {
        updateTextDimensions();
        resetPosition();
    }, 100);
    
    showStatus('Ready - Press Space to play/pause, I for infinite mode', 3000);
    
    console.log('Desktop Prompter initialized - Edge compatible');
}

// DOM Ready handler for older browsers
function domReady(callback) {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

// Initialize when DOM is ready
domReady(initializeApp);

// Additional initialization on window load
window.addEventListener('load', function() {
    setTimeout(initializeApp, 50);
});

// Paste event handler
document.addEventListener('paste', function(e) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        
        var text = '';
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

console.log('Desktop Prompter v2.0 - Edge Compatible with Fixed Infinite Scroll');
