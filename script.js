// Elements
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

const CURTAIN_DELAY = 3000; // 3 seconds for curtain to rise
const PRE_COUNTDOWN_DELAY = 3000; // 3 seconds

// Set background music to quiet volume and mute initially
bgMusic.volume = 0.05;
bgMusic.muted = true;

// Mute all audio initially
countdownAudio.muted = true;
yesSound.muted = true;
yesSound2.muted = true;
noSound.muted = true;

// Track if video is loaded
let videoLoaded = false;
let curtainCanRise = false;

// Wait for video to be ready to play
countdownVideo.addEventListener('canplaythrough', () => {
    videoLoaded = true;
    console.log("Video loaded and ready");
    if (curtainCanRise) {
        raiseCurtain();
    }
}, { once: true });

// Also handle if video is already loaded
if (countdownVideo.readyState >= 3) { // HAVE_FUTURE_DATA or better
    videoLoaded = true;
    console.log("Video already loaded");
}

// Function to raise curtain
const raiseCurtain = () => {
    curtain.classList.add("raised");
    
    // Unmute countdown audio after curtain rises
    countdownAudio.muted = false;
    countdownAudio.volume = 0.5;
    
    // Unmute other sounds
    yesSound.muted = false;
    yesSound2.muted = false;
    noSound.muted = false;
};

// Wait for minimum 3 seconds, then check if video is ready
setTimeout(() => {
    curtainCanRise = true;
    if (videoLoaded) {
        raiseCurtain();
    } else {
        console.log("Waiting for video to load...");
        // The canplaythrough event will trigger raiseCurtain when ready
    }
}, CURTAIN_DELAY);

// Countdown Timer - wait for audio/video to finish naturally
const countdownDuration = 76000; // 76 seconds in milliseconds

// Start countdown video and audio immediately
let audioVideoSyncInterval;
let countdownEnded = false;

const transitionFromCountdown = () => {
    if (countdownEnded) return;
    countdownEnded = true;
    
    // Stop countdown interval check but keep video and audio playing in background
    clearInterval(audioVideoSyncInterval);
    
    // Hide countdown, show envelope
    countdownContainer.style.display = "none";
    envelope.style.display = "flex";
    
    // Start background music after countdown and unmute with fade-in
    bgMusic.muted = false;
    bgMusic.volume = 0; // Start at 0
    const targetVolume = 0.05;
    const fadeDuration = 2000; // 2 seconds
    const startTime = Date.now();
    
    bgMusic.play().catch(() => {
        // If autoplay fails, try on next user interaction
        document.addEventListener('click', () => {
            bgMusic.play();
        }, { once: true });
    });
    
    // Fade in the volume gradually
    const fadeInInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        bgMusic.volume = targetVolume * progress;
        
        if (progress === 1) {
            clearInterval(fadeInInterval);
            // Now pause the countdown audio and video since they're done fading
            countdownAudio.pause();
            countdownVideo.pause();
        }
    }, 50);
};

const playCountdownSync = () => {
    // Reset both to start
    countdownVideo.currentTime = 0;
    countdownAudio.currentTime = 0;
    
    // Audio will already be unmuted by the curtain timer
    // Just set the volume
    countdownAudio.volume = 0.5;
    
    // Play video and audio at the exact same time
    countdownVideo.play().catch(err => console.log("Video play error:", err));
    countdownAudio.play().catch(err => console.log("Audio play error:", err));
    
    // Lightweight sync check - only check every 500ms to reduce performance impact
    const syncInterval = setInterval(() => {
        if (countdownEnded) {
            clearInterval(syncInterval);
            return;
        }
        
        const timeDiff = Math.abs(countdownVideo.currentTime - countdownAudio.currentTime);
        
        // Only resync if they drift more than 0.3 seconds apart
        if (timeDiff > 0.3) {
            countdownVideo.currentTime = countdownAudio.currentTime;
        }
    }, 500); // Check every 500ms (less frequent, less lag)
    
    // Transition when audio finishes (most reliable)
    countdownAudio.onended = transitionFromCountdown;
    
    // Also transition when video finishes
    countdownVideo.onended = transitionFromCountdown;
    
    // Fade out the audio and video for the last 2 seconds only
    const fadeOutDuration = 2000; // 2 seconds
    const fadeOutStartTime = countdownDuration - fadeOutDuration;
    
    setTimeout(() => {
        const fadeOutStart = Date.now();
        const fadeOutInterval = setInterval(() => {
            const elapsed = Date.now() - fadeOutStart;
            const progress = Math.min(elapsed / fadeOutDuration, 1);
            
            // Fade out audio volume
            countdownAudio.volume = 0.5 * (1 - progress);
            
            // Fade out video opacity
            countdownVideo.style.opacity = 1 - progress;
            
            if (progress === 1) {
                clearInterval(fadeOutInterval);
                countdownVideo.style.opacity = 0;
            }
        }, 200); // Check every 200ms instead of 50ms
    }, fadeOutStartTime);
    
    // Fallback: transition after countdownDuration if neither ends
    setTimeout(transitionFromCountdown, countdownDuration);
};

setTimeout(() => {
    playCountdownSync();
}, PRE_COUNTDOWN_DELAY);

const title = document.getElementById("letter-title");
const catImg = document.getElementById("letter-capy");
const buttons = document.getElementById("letter-buttons");
const finalText = document.getElementById("final-text");

// Yes button click counter
let yesClickCount = 0;
const MAX_YES_CLICKS = 6;

// Click Envelope

envelope.addEventListener("click", () => {
    envelope.style.display = "none";
    letter.style.display = "flex";

    setTimeout( () => {
        document.querySelector(".letter-window").classList.add("open");
    },50);
});

// Function to trigger the yes response
const triggerYesResponse = (button) => {
    yesClickCount++;
    
    // Play sound on every click
    yesSound.currentTime = 0;
    yesSound.play();
    
    if (yesClickCount < MAX_YES_CLICKS) {
        // Expand the button slightly
        const currentScale = 1 + (yesClickCount * 0.15); // Each click adds 15% scale
        button.style.transform = `scale(${currentScale})`;
        button.style.transition = "transform 0.3s ease";
        
        // Update title text
        if (yesClickCount === 1) {
            title.textContent = "Sure?";
        } else {
            // Add more question marks
            const questionMarks = "?".repeat(yesClickCount);
            title.textContent = "Sure?" + questionMarks;
        }
    } else {
        // On the 6th click, accept the response
        yesSound2.currentTime = 0;
        yesSound2.play();
        
        title.textContent = "Yippeeee! Valentine na kita Taly";
        catImg.src = "capy_happy.gif";
        document.querySelector(".letter-window").classList.add("final");
        buttons.style.display = "none";
        finalText.style.display = "block";
    }
};

// Logic to move the NO btn - BULLETPROOF VIEWPORT CONSTRAINT
let noButtonMoveCount = 0;
let currentTransformX = 0;
let currentTransformY = 0;
let convertedYesButton = null;
let convertedYesTransformX = 0;
let convertedYesTransformY = 0;

function getConstrainedPosition(x, y, button) {
    // Get the button's actual dimensions
    const buttonWidth = button.offsetWidth || 90;
    const buttonHeight = button.offsetHeight || 90;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Get button's parent container position
    const buttonContainer = button.parentElement;
    const containerRect = buttonContainer.getBoundingClientRect();
    const originalX = containerRect.left + containerRect.width / 2;
    const originalY = containerRect.top + containerRect.height / 2;
    
    // Calculate the absolute position if we apply the transform
    const absoluteX = originalX + x;
    const absoluteY = originalY + y;
    
    // Define safe boundaries (button edges must stay within viewport)
    const minX = buttonWidth / 2 + 20; // 20px padding from left
    const maxX = viewportWidth - (buttonWidth / 2) - 20; // 20px padding from right
    const minY = buttonHeight / 2 + 20; // 20px padding from top
    const maxY = viewportHeight - (buttonHeight / 2) - 20; // 20px padding from bottom
    
    // Constrain the absolute position
    const constrainedAbsoluteX = Math.max(minX, Math.min(maxX, absoluteX));
    const constrainedAbsoluteY = Math.max(minY, Math.min(maxY, absoluteY));
    
    // Convert back to transform values
    const constrainedX = constrainedAbsoluteX - originalX;
    const constrainedY = constrainedAbsoluteY - originalY;
    
    return { x: constrainedX, y: constrainedY };
}

noBtn.addEventListener("mouseover", handleNoButtonInteraction);
noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent default touch behavior
    handleNoButtonInteraction();
});

function handleNoButtonInteraction() {
    noButtonMoveCount++;
    
    noSound.currentTime = 0;
    noSound.play();
    
    // Check if no button should convert to yes button
    if (noButtonMoveCount >= 20) {
        // Hide the original no button
        noBtn.style.display = "none";
        
        // Create a new yes button from the converted no button
        convertedYesButton = document.createElement("img");
        convertedYesButton.src = "yes.png";
        convertedYesButton.alt = "Yes";
        convertedYesButton.classList.add("btn", "yes-btn", "converted-yes-btn");
        convertedYesButton.style.position = "absolute";
        convertedYesButton.style.top = "50%";
        convertedYesButton.style.left = "50%";
        convertedYesButton.style.zIndex = "10";
        convertedYesButton.style.cursor = "pointer";
        
        // Insert it in the same wrapper as the no button
        noBtn.parentElement.appendChild(convertedYesButton);
        
        // Add click listener to the new yes button - pass button reference
        convertedYesButton.addEventListener("click", () => triggerYesResponse(convertedYesButton));
        
        // Reset position trackers for the new button
        convertedYesTransformX = 0;
        convertedYesTransformY = 0;
        convertedYesButton.style.transform = `translate(-50%, -50%)`;
        
        // Remove the mouseover and touchstart event listeners from original no button
        noBtn.removeEventListener("mouseover", handleNoButtonInteraction);
        noBtn.removeEventListener("touchstart", handleNoButtonInteraction);
        
        return;
    }
    
    // Generate random movement
    const distance = 150;
    const angle = Math.random() * Math.PI * 2;
    
    let moveX = Math.cos(angle) * distance;
    let moveY = Math.sin(angle) * distance;
    
    // Calculate new potential position
    let newX = currentTransformX + moveX;
    let newY = currentTransformY + moveY;
    
    // ENFORCE VIEWPORT CONSTRAINTS
    const constrained = getConstrainedPosition(newX, newY, noBtn);
    newX = constrained.x;
    newY = constrained.y;
    
    // Update current transform position
    currentTransformX = newX;
    currentTransformY = newY;

    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = `translate(${newX}px, ${newY}px)`;
}

// YES button click handler
yesBtn.addEventListener("click", () => triggerYesResponse(yesBtn));

// Handle window resize to recalculate constraints
window.addEventListener("resize", () => {
    // Reapply no button transform with new viewport constraints
    const constrained = getConstrainedPosition(currentTransformX, currentTransformY, noBtn);
    currentTransformX = constrained.x;
    currentTransformY = constrained.y;
    noBtn.style.transform = `translate(${currentTransformX}px, ${currentTransformY}px)`;
    
    // Reapply converted yes button transform if it exists
    if (convertedYesButton) {
        const constrainedConverted = getConstrainedPosition(convertedYesTransformX, convertedYesTransformY, convertedYesButton);
        convertedYesTransformX = constrainedConverted.x;
        convertedYesTransformY = constrainedConverted.y;
        convertedYesButton.style.transform = `translate(${convertedYesTransformX}px, ${convertedYesTransformY}px)`;
    }
});

// Handle visibility change to prevent audio/video desync when tab is hidden
document.addEventListener("visibilitychange", () => {
    if (!countdownEnded) {
        if (document.hidden) {
            // Tab is hidden - pause both
            countdownVideo.pause();
            countdownAudio.pause();
        } else {
            // Tab is visible again - resume and resync
            const audioTime = countdownAudio.currentTime;
            countdownVideo.currentTime = audioTime; // Sync video to audio
            
            countdownVideo.play().catch(err => console.log("Video resume error:", err));
            countdownAudio.play().catch(err => console.log("Audio resume error:", err));
        }
    }
});