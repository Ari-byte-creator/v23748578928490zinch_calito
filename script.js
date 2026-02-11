// ===== ELEMENT SELECTORS =====
const envelope = document.getElementById("envelope-container");
const letter = document.getElementById("letter-container");
const noBtn = document.querySelector(".no-btn");
const yesBtn = document.querySelector(".btn[alt='Yes']");
const bgMusic = document.getElementById("bgMusic");
const countdownContainer = document.getElementById("countdown-container");
const countdownAudio = document.getElementById("countdownAudio");
const countdownVideo = document.getElementById("countdown-video");
const yesSound = document.getElementById("yesSound");
const yesSound2 = document.getElementById("yesSound2");
const noSound = document.getElementById("noSound");
const curtain = document.getElementById("curtain");

// ===== CONSTANTS =====
const CURTAIN_DELAY = 3000;
const VIDEO_TIMEOUT = 8000;
const COUNTDOWN_DURATION = 76000;
const PRE_COUNTDOWN_DELAY = 500;

// ===== AUDIO INITIALIZATION =====
bgMusic.volume = 0.05;
bgMusic.muted = true;

countdownAudio.muted = true;
countdownAudio.volume = 0.5;
yesSound.muted = true;
yesSound2.muted = true;
yesSound2.volume = 0.3;
noSound.muted = true;
noSound.volume = 0.3;

// ===== VIDEO & CURTAIN STATE =====
let videoLoaded = false;
let videoLoadStartTime = Date.now();
let curtainCanRise = false;
let countdownStarted = false;
let countdownEnded = false;
let audioVideoSyncInterval = null;

// ===== AGGRESSIVE VIDEO LOADING STRATEGY =====
function ensureVideoReady() {
    countdownVideo.load();
    
    if (countdownVideo.readyState >= 2) {
        console.log("Video already loaded, readyState:", countdownVideo.readyState);
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        let resolved = false;
        const loadTimeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.error("Video failed to load within timeout - attempting recovery");
                attemptVideoRecovery().then(resolve, resolve);
            }
        }, VIDEO_TIMEOUT);
        
        const handleReady = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(loadTimeout);
                countdownVideo.removeEventListener('canplay', handleReady);
                countdownVideo.removeEventListener('loadedmetadata', handleReady);
                countdownVideo.removeEventListener('canplaythrough', handleReady);
                console.log("Video loaded successfully");
                resolve();
            }
        };
        
        countdownVideo.addEventListener('canplay', handleReady, { once: true });
        countdownVideo.addEventListener('loadedmetadata', handleReady, { once: true });
        countdownVideo.addEventListener('canplaythrough', handleReady, { once: true });
        
        const readyStateCheck = setInterval(() => {
            if (countdownVideo.readyState >= 2 && !resolved) {
                resolved = true;
                clearTimeout(loadTimeout);
                clearInterval(readyStateCheck);
                countdownVideo.removeEventListener('canplay', handleReady);
                countdownVideo.removeEventListener('loadedmetadata', handleReady);
                countdownVideo.removeEventListener('canplaythrough', handleReady);
                console.log("Video detected ready via readyState check");
                resolve();
            }
        }, 200);
    });
}

// ===== VIDEO RECOVERY STRATEGY =====
function attemptVideoRecovery() {
    console.log("Attempting video recovery...");
    
    return new Promise((resolve) => {
        const originalSrc = countdownVideo.querySelector('source').src;
        countdownVideo.pause();
        countdownVideo.currentTime = 0;
        
        const source = countdownVideo.querySelector('source');
        const newSource = document.createElement('source');
        newSource.src = originalSrc + '?t=' + Date.now();
        newSource.type = 'video/mp4';
        
        countdownVideo.innerHTML = '';
        countdownVideo.appendChild(newSource);
        countdownVideo.load();
        
        console.log("Video recovery: source refreshed with cache-bust parameter");
        
        const recoveryTimeout = setTimeout(() => {
            console.log("Recovery attempt complete. Current readyState:", countdownVideo.readyState);
            resolve();
        }, 3000);
        
        const handleRecoveryLoad = () => {
            clearTimeout(recoveryTimeout);
            countdownVideo.removeEventListener('canplay', handleRecoveryLoad);
            console.log("Video recovered successfully");
            resolve();
        };
        
        countdownVideo.addEventListener('canplay', handleRecoveryLoad, { once: true });
    });
}

// ===== CURTAIN RAISING =====
const raiseCurtain = async () => {
    const loadingIndicator = document.querySelector('.loading-indicator');
    
    try {
        loadingIndicator.textContent = "Loading video...";
        await ensureVideoReady();
        loadingIndicator.textContent = "Ready! Opening...";
    } catch (err) {
        console.error("Error during video loading:", err);
        loadingIndicator.textContent = "Proceeding...";
    }
    
    if (countdownVideo.readyState >= 2) {
        console.log("✓ Video ready to play");
    } else {
        console.warn("⚠ Video may not be fully ready, but proceeding anyway (readyState: " + countdownVideo.readyState + ")");
    }
    
    curtain.classList.add("raised");
    
    countdownAudio.muted = false;
    yesSound.muted = false;
    yesSound2.muted = false;
    noSound.muted = false;
};

// ===== STARTUP SEQUENCE =====
(async () => {
    await new Promise(resolve => setTimeout(resolve, CURTAIN_DELAY));
    
    curtainCanRise = true;
    
    await raiseCurtain();
    
    await new Promise(resolve => setTimeout(resolve, PRE_COUNTDOWN_DELAY));
    
    playCountdownSync();
})();

// ===== COUNTDOWN & AUDIO/VIDEO SYNC =====
const transitionFromCountdown = () => {
    if (countdownEnded) return;
    countdownEnded = true;
    
    if (audioVideoSyncInterval) {
        clearInterval(audioVideoSyncInterval);
        audioVideoSyncInterval = null;
    }
    
    countdownContainer.style.display = "none";
    envelope.style.display = "flex";
    
    bgMusic.muted = false;
    bgMusic.volume = 0;
    const targetVolume = 0.025;
    const fadeDuration = 2000;
    const startTime = Date.now();
    
    bgMusic.play().catch(() => {
        document.addEventListener('click', () => {
            bgMusic.play();
        }, { once: true });
    });
    
    const fadeInInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        bgMusic.volume = targetVolume * progress;
        
        if (progress === 1) {
            clearInterval(fadeInInterval);
            countdownAudio.pause();
            countdownVideo.pause();
            countdownVideo.currentTime = 0;
        }
    }, 50);
};

function playCountdownSync() {
    if (countdownStarted) return;
    countdownStarted = true;
    
    countdownVideo.currentTime = 0;
    countdownAudio.currentTime = 0;
    
    const videoPlayPromise = countdownVideo.play().catch(err => {
        console.error("Video play error:", err);
        setTimeout(transitionFromCountdown, COUNTDOWN_DURATION);
    });
    
    const audioPlayPromise = countdownAudio.play().catch(err => {
        console.error("Audio play error:", err);
        setTimeout(transitionFromCountdown, COUNTDOWN_DURATION);
    });
    
    Promise.all([videoPlayPromise, audioPlayPromise]).then(() => {
        startAudioVideoSync();
    });
    
    const fadeOutDuration = 2000;
    const fadeOutStartTime = COUNTDOWN_DURATION - fadeOutDuration;
    
    setTimeout(() => {
        const fadeOutStart = Date.now();
        const fadeOutInterval = setInterval(() => {
            const elapsed = Date.now() - fadeOutStart;
            const progress = Math.min(elapsed / fadeOutDuration, 1);
            
            countdownAudio.volume = 0.5 * (1 - progress);
            countdownVideo.style.opacity = 1 - progress;
            
            if (progress === 1) {
                clearInterval(fadeOutInterval);
                countdownVideo.style.opacity = 0;
            }
        }, 200);
    }, fadeOutStartTime);
    
    setTimeout(transitionFromCountdown, COUNTDOWN_DURATION + 500);
}

function startAudioVideoSync() {
    countdownAudio.onended = transitionFromCountdown;
    countdownVideo.onended = transitionFromCountdown;
    
    audioVideoSyncInterval = setInterval(() => {
        if (countdownEnded || countdownVideo.paused || countdownAudio.paused) {
            if (audioVideoSyncInterval) {
                clearInterval(audioVideoSyncInterval);
                audioVideoSyncInterval = null;
            }
            return;
        }
        
        const timeDiff = Math.abs(countdownVideo.currentTime - countdownAudio.currentTime);
        
        if (timeDiff > 0.5) {
            countdownVideo.currentTime = countdownAudio.currentTime;
        }
    }, 500);
}

// ===== VISIBILITY CHANGE HANDLER =====
document.addEventListener("visibilitychange", () => {
    if (countdownEnded || !countdownStarted) return;
    
    if (document.hidden) {
        countdownVideo.pause();
        countdownAudio.pause();
    } else {
        const audioTime = countdownAudio.currentTime;
        countdownVideo.currentTime = audioTime;
        
        countdownVideo.play().catch(err => console.error("Video resume error:", err));
        countdownAudio.play().catch(err => console.error("Audio resume error:", err));
    }
});

// ===== ENVELOPE INTERACTION =====
envelope.addEventListener("click", () => {
    envelope.style.display = "none";
    letter.style.display = "flex";
    
    setTimeout(() => {
        document.querySelector(".letter-window").classList.add("open");
    }, 50);
});

// ===== YES BUTTON RESPONSE =====
const title = document.getElementById("letter-title");
const catImg = document.getElementById("letter-capy");
const buttons = document.getElementById("letter-buttons");
const finalText = document.getElementById("final-text");

let yesClickCount = 0;
const MAX_YES_CLICKS = 10;

const triggerYesResponse = (button) => {
    yesClickCount++;
    
    yesSound.currentTime = 0;
    yesSound.play();
    
    if (yesClickCount < MAX_YES_CLICKS) {
        const currentScale = 1 + (yesClickCount * 0.15);
        
        if (button.classList.contains("converted-yes-btn")) {
            const yTransform = convertedYesTransformY;
            button.style.transform = `translate(-50%, -50%) translateY(${yTransform}px) scale(${currentScale})`;
        } else {
            button.style.transform = `scale(${currentScale})`;
        }
        
        button.style.transition = "transform 0.3s ease";
        
        const responses = [
            "Sure?",
            "Really sure?",
            "Are you certain? 🥺",
            "Pwease? 🥺👉👈",
            "Pretty sure?",
            "Super duper sure?",
            "100% sure? 💕",
            "Absolutely certain?",
            "Pinky promise sure?",
            "With your whole heart sure?"
        ];
        
        title.textContent = responses[yesClickCount - 1];
    } else {
        yesSound2.currentTime = 0;
        yesSound2.volume = 0.1
        yesSound2.play();
        
        title.textContent = "Yippeeee! Valentine na kita Taly";
        catImg.src = "capy_happy.gif";
        document.querySelector(".letter-window").classList.add("final");
        buttons.style.display = "none";
        finalText.style.display = "block";
    }
};

yesBtn.addEventListener("click", () => triggerYesResponse(yesBtn));

// ===== NO BUTTON EVASION - STATIC VISIBLE INITIALLY, DYNAMIC ON FIRST INTERACTION =====
let noButtonMoveCount = 0;
let currentTransformX = 0;
let currentTransformY = 0;
let movingNoButton = null;
let firstInteraction = false;
let convertedYesButton = null;
let convertedYesTransformY = 0;

function getConstrainedPosition(x, y, button) {
    const buttonWidth = button.offsetWidth || 90;
    const buttonHeight = button.offsetHeight || 90;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const buttonContainer = button.parentElement;
    const containerRect = buttonContainer.getBoundingClientRect();
    const originalX = containerRect.left + containerRect.width / 2;
    const originalY = containerRect.top + containerRect.height / 2;
    
    const absoluteX = originalX + x;
    const absoluteY = originalY + y;
    
    const minX = buttonWidth / 2 + 20;
    const maxX = viewportWidth - (buttonWidth / 2) - 20;
    const minY = buttonHeight / 2 + 20;
    const maxY = viewportHeight - (buttonHeight / 2) - 20;
    
    const constrainedAbsoluteX = Math.max(minX, Math.min(maxX, absoluteX));
    const constrainedAbsoluteY = Math.max(minY, Math.min(maxY, absoluteY));
    
    const constrainedX = constrainedAbsoluteX - originalX;
    const constrainedY = constrainedAbsoluteY - originalY;
    
    return { x: constrainedX, y: constrainedY };
}

function handleStaticNoButtonInteraction() {
    // First interaction: hide static button, create dynamic button
    if (!firstInteraction) {
        firstInteraction = true;
        noBtn.style.display = "none";
        
        // Create dynamic moving no button
        movingNoButton = document.createElement("img");
        movingNoButton.src = "no.png";
        movingNoButton.alt = "No";
        movingNoButton.classList.add("btn", "moving-no-btn");
        movingNoButton.style.position = "absolute";
        movingNoButton.style.top = "50%";
        movingNoButton.style.left = "50%";
        movingNoButton.style.zIndex = "10";
        movingNoButton.style.cursor = "default";
        movingNoButton.style.willChange = "transform";
        movingNoButton.style.touchAction = "none";
        
        noBtn.parentElement.appendChild(movingNoButton);
        movingNoButton.style.transform = `translate(-50%, -50%)`;
        
        // Add interaction listeners to dynamic button
        movingNoButton.addEventListener("mouseover", handleDynamicNoButtonInteraction);
        movingNoButton.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handleDynamicNoButtonInteraction();
        });
    }
    
    noButtonMoveCount++;
    noSound.currentTime = 0;
    noSound.play();
    
    // Check if should convert to yes button
    if (noButtonMoveCount >= 20) {
        movingNoButton.style.display = "none";
        
        convertedYesButton = document.createElement("img");
        convertedYesButton.src = "yes.png";
        convertedYesButton.alt = "Yes";
        convertedYesButton.classList.add("btn", "yes-btn", "converted-yes-btn");
        convertedYesButton.style.position = "absolute";
        convertedYesButton.style.zIndex = "10";
        convertedYesButton.style.cursor = "pointer";
        
        noBtn.parentElement.appendChild(convertedYesButton);
        convertedYesButton.addEventListener("click", () => triggerYesResponse(convertedYesButton));
        
        const originalYesBtn = document.querySelector(".btn[alt='Yes']");
        const originalYesRect = originalYesBtn.getBoundingClientRect();
        const containerRect = noBtn.parentElement.getBoundingClientRect();
        
        const targetY = originalYesRect.top - containerRect.top;
        const buttonHeight = convertedYesButton.offsetHeight || 90;
        const containerHeight = noBtn.parentElement.offsetHeight;
        const centerY = (containerHeight / 2) - (buttonHeight / 2);
        
        convertedYesTransformY = targetY - centerY;
        convertedYesButton.style.transform = `translate(-50%, -50%) translateY(${convertedYesTransformY}px)`;
        
        return;
    }
    
    // Move the dynamic button
    const distance = 150;
    const angle = Math.random() * Math.PI * 2;
    
    let moveX = Math.cos(angle) * distance;
    let moveY = Math.sin(angle) * distance;
    
    let newX = currentTransformX + moveX;
    let newY = currentTransformY + moveY;
    
    const constrained = getConstrainedPosition(newX, newY, movingNoButton);
    newX = constrained.x;
    newY = constrained.y;
    
    currentTransformX = newX;
    currentTransformY = newY;
    
    movingNoButton.style.transition = "transform 0.3s ease";
    movingNoButton.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
}

function handleDynamicNoButtonInteraction() {
    noButtonMoveCount++;
    noSound.currentTime = 0;
    noSound.play();
    
    // Check if should convert to yes button
    if (noButtonMoveCount >= 20) {
        movingNoButton.style.display = "none";
        
        convertedYesButton = document.createElement("img");
        convertedYesButton.src = "yes.png";
        convertedYesButton.alt = "Yes";
        convertedYesButton.classList.add("btn", "yes-btn", "converted-yes-btn");
        convertedYesButton.style.position = "absolute";
        convertedYesButton.style.zIndex = "10";
        convertedYesButton.style.cursor = "pointer";
        
        noBtn.parentElement.appendChild(convertedYesButton);
        convertedYesButton.addEventListener("click", () => triggerYesResponse(convertedYesButton));
        
        const originalYesBtn = document.querySelector(".btn[alt='Yes']");
        const originalYesRect = originalYesBtn.getBoundingClientRect();
        const containerRect = noBtn.parentElement.getBoundingClientRect();
        
        const targetY = originalYesRect.top - containerRect.top;
        const buttonHeight = convertedYesButton.offsetHeight || 90;
        const containerHeight = noBtn.parentElement.offsetHeight;
        const centerY = (containerHeight / 2) - (buttonHeight / 2);
        
        convertedYesTransformY = targetY - centerY;
        convertedYesButton.style.transform = `translate(-50%, -50%) translateY(${convertedYesTransformY}px)`;
        
        return;
    }
    
    // Move the dynamic button
    const distance = 150;
    const angle = Math.random() * Math.PI * 2;
    
    let moveX = Math.cos(angle) * distance;
    let moveY = Math.sin(angle) * distance;
    
    let newX = currentTransformX + moveX;
    let newY = currentTransformY + moveY;
    
    const constrained = getConstrainedPosition(newX, newY, movingNoButton);
    newX = constrained.x;
    newY = constrained.y;
    
    currentTransformX = newX;
    currentTransformY = newY;
    
    movingNoButton.style.transition = "transform 0.3s ease";
    movingNoButton.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
}

// Listeners on STATIC no button
noBtn.addEventListener("mouseover", handleStaticNoButtonInteraction);
noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleStaticNoButtonInteraction();
});

// ===== WINDOW RESIZE & ORIENTATION HANDLERS =====
window.addEventListener("resize", () => {
    if (movingNoButton && movingNoButton.style.display !== "none") {
        const constrained = getConstrainedPosition(currentTransformX, currentTransformY, movingNoButton);
        currentTransformX = constrained.x;
        currentTransformY = constrained.y;
        movingNoButton.style.transform = `translate(calc(-50% + ${currentTransformX}px), calc(-50% + ${currentTransformY}px))`;
    }
    
    if (convertedYesButton) {
        const originalYesBtn = document.querySelector(".btn[alt='Yes']");
        const originalYesRect = originalYesBtn.getBoundingClientRect();
        const containerRect = noBtn.parentElement.getBoundingClientRect();
        
        const targetY = originalYesRect.top - containerRect.top;
        const buttonHeight = convertedYesButton.offsetHeight || 90;
        const containerHeight = noBtn.parentElement.offsetHeight;
        const centerY = (containerHeight / 2) - (buttonHeight / 2);
        
        convertedYesTransformY = targetY - centerY;
        convertedYesButton.style.transform = `translate(-50%, -50%) translateY(${convertedYesTransformY}px)`;
    }
});

window.addEventListener("orientationchange", () => {
    setTimeout(() => {
        if (movingNoButton && movingNoButton.style.display !== "none") {
            const constrained = getConstrainedPosition(currentTransformX, currentTransformY, movingNoButton);
            currentTransformX = constrained.x;
            currentTransformY = constrained.y;
            movingNoButton.style.transform = `translate(calc(-50% + ${currentTransformX}px), calc(-50% + ${currentTransformY}px))`;
        }
        
        if (convertedYesButton) {
            const originalYesBtn = document.querySelector(".btn[alt='Yes']");
            const originalYesRect = originalYesBtn.getBoundingClientRect();
            const containerRect = noBtn.parentElement.getBoundingClientRect();
            
            const targetY = originalYesRect.top - containerRect.top;
            const buttonHeight = convertedYesButton.offsetHeight || 90;
            const containerHeight = noBtn.parentElement.offsetHeight;
            const centerY = (containerHeight / 2) - (buttonHeight / 2);
            
            convertedYesTransformY = targetY - centerY;
            convertedYesButton.style.transform = `translate(-50%, -50%) translateY(${convertedYesTransformY}px)`;
        }
    }, 100);
});

document.addEventListener("fullscreenchange", () => {
    setTimeout(() => {
        if (movingNoButton && movingNoButton.style.display !== "none") {
            const constrained = getConstrainedPosition(currentTransformX, currentTransformY, movingNoButton);
            currentTransformX = constrained.x;
            currentTransformY = constrained.y;
            movingNoButton.style.transform = `translate(calc(-50% + ${currentTransformX}px), calc(-50% + ${currentTransformY}px))`;
        }
        
        if (convertedYesButton) {
            const originalYesBtn = document.querySelector(".btn[alt='Yes']");
            const originalYesRect = originalYesBtn.getBoundingClientRect();
            const containerRect = noBtn.parentElement.getBoundingClientRect();
            
            const targetY = originalYesRect.top - containerRect.top;
            const buttonHeight = convertedYesButton.offsetHeight || 90;
            const containerHeight = noBtn.parentElement.offsetHeight;
            const centerY = (containerHeight / 2) - (buttonHeight / 2);
            
            convertedYesTransformY = targetY - centerY;
            convertedYesButton.style.transform = `translate(-50%, -50%) translateY(${convertedYesTransformY}px)`;
        }
    }, 100);
});