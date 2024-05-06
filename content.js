// Global variable to keep track of the user's latest volume
let userVolume = null;

// Check if the current page is a YouTube video page
function isVideoPage() {
  return window.location.href.includes('/watch?v=');
}

// Check for ads on the current page
function checkForAds() {
  if (isVideoPage()) {
    const adSelector = ['div.ad-showing'];
    const videoPlayerSelector = document.querySelector('#movie_player > div.html5-video-container > video');

    const adsPresent = adSelector.some(selector => document.querySelector(selector));

    if (adsPresent) {
      videoPlayerSelector.style.opacity = '0';
      muteVideo();
      setVideoSpeed(16);
      clickSkip();
      if (!collectedAdCount) {
        getAdCount();
      }
    } else {
      if (adSkipProcess) {
        videoPlayerSelector.style.opacity = '1';
        unmuteVideo();
        setVideoSpeed(1);
        collectedAdCount = false;
      }
    }
  }
}

// Set video speed
function setVideoSpeed(speed) {
  if (isVideoPage()) {
    const player = document.querySelector('video');
    if (player) {
      player.playbackRate = speed;
    }
  }
}

// Click the skip button
function clickSkip() {
  const skipButtonClass = 'ytp-skip-ad-button';
  const skipButton = document.querySelector(`.${skipButtonClass}`);

  const isSkipButtonClickable = skipButton && skipButton.offsetParent !== null;

  if (isSkipButtonClickable) {
    skipButton.click();
  }
}

// Mute the video, and save the user's current volume
function muteVideo() {
  const player = document.querySelector('video');
  if (player) {
    // Save the user's current volume only if not already muted
    if (player.volume !== 0 && userVolume === null) {
      userVolume = player.volume;
    }
    player.volume = 0;
  }
  adSkipProcess = true;
}

// Unmute the video and restore the user's last volume
function unmuteVideo() {
  const player = document.querySelector('video');
  if (player) {
    // Restore the user's last volume or use the original volume
    player.volume = userVolume !== null ? userVolume : 0.5; // Assuming 0.5 is a reasonable default volume
  }
  adSkipProcess = false;
}

// Get the number of ads
function getAdCount() {
  const adModuleElement = document.querySelector('#movie_player > div.video-ads.ytp-ad-module');
  if (adModuleElement) {
    const adModuleTextContent = adModuleElement.innerText;

    if (adModuleTextContent.length !== 0) {
      collectedAdCount = true;

      if (adModuleTextContent.includes('Sponsored 1 of ')) {
        const adCount = parseInt(adModuleTextContent.split('Sponsored 1 of ').pop().split(' ')[0], 10);
        chrome.runtime.sendMessage({ action: 'addAdsBlockedCount', adCount });
      } else if (adModuleTextContent.includes('Sponsored')) {
        chrome.runtime.sendMessage({ action: 'addAdsBlockedCount', adCount: 1 });
      }
    }
  }
}

// Function to be called whenever the DOM changes
function handleDOMChanges(mutationsList) {
  if (Array.isArray(mutationsList)) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        if (isVideoPage()) {
          chrome.storage.sync.get('adBlockerState', function (data) {
            if (data.adBlockerState) {
              checkForAds();
            }
          });
        }

        // Store the volume change only if no ads are present
        const adSelector = ['div.ad-showing'];
        const adsPresent = adSelector.some(selector => document.querySelector(selector));
        if (!adsPresent) {
          const player = document.querySelector('video');
          if (player) {
            player.addEventListener('volumechange', () => {
              // Update userVolume whenever the volume changes
              if (player.volume !== 0) {
                userVolume = player.volume;
              }
            });
          }
        }
      }
    }
  }
}

// Keep track of the process state (true if ad skip process is running, false otherwise)
adSkipProcess = false;

// Keep track of whether the ad count has been collected
collectedAdCount = false;

// Set up a MutationObserver to monitor changes in the DOM
const observer = new MutationObserver(mutationsList => handleDOMChanges(mutationsList));

// Define the target node (the root of the DOM tree to observe)
const targetNode = document.body;

// Configuration of the observer
const config = { childList: true, subtree: true };

// Start observing the target node for changes
observer.observe(targetNode, config);