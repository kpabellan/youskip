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
      if (adSkipProcess == true) {
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
  const skipButtonClass = 'ytp-ad-skip-button-modern';
  const skipButton = document.querySelector(`.${skipButtonClass}`);

  const isSkipButtonClickable = skipButton && skipButton.offsetParent !== null;

  if (isSkipButtonClickable) {
    skipButton.click();
  }
}

// Mute the video
function muteVideo() {
  adSkipProcess = true;
  const player = document.querySelector('video');
  if (player) {
    if (!player.originalVolume) {
      player.originalVolume = player.volume;
    }

    player.volume = 0;
  }
}

// Unmute the video
function unmuteVideo() {
  adSkipProcess = false;
  const player = document.querySelector('video');
  if (player && player.originalVolume !== undefined) {
    player.volume = player.originalVolume;
  }
}

// Get the number of ads
function getAdCount() {
  const adModuleElement = document.querySelector('#movie_player > div.video-ads.ytp-ad-module');
  if (adModuleElement) {
    const adModuleTextContent = adModuleElement.innerText;

    if (adModuleTextContent.length != 0) {
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
        chrome.runtime.sendMessage({ action: 'getAdBlockerState' }, function (response) {
          const adBlockerState = response.adBlockerState || false;
          if (adBlockerState) {
            checkForAds();
          }
        });
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.adBlockerState !== undefined) {
    adBlockerState = request.adBlockerState;
    chrome.runtime.sendMessage({ action: 'setAdBlockerState', adBlockerState });
  }
});