// Default adBlockerState
let adBlockerState = false;

// Retrieve adBlockerState from storage on extension startup
chrome.storage.sync.get("adBlockerState", function (data) {
  if (data.adBlockerState !== undefined) {
    adBlockerState = data.adBlockerState;
  }
});

// Function to set adBlockerState in storage
function setAdBlockerState(newState, callback) {
  adBlockerState = newState;
  chrome.storage.sync.set({ "adBlockerState": newState }, callback);
}

// Function to get blockedAdsCount from storage
function getBlockedAdsCount(callback) {
  chrome.storage.sync.get("blockedAdsCount", function (data) {
    callback(data.blockedAdsCount || 0);
  });
}

// Function to increment and update blockedAdsCount in storage
function addAdsBlockedCount(adCount, callback) {
  getBlockedAdsCount(function (blockedAdsCount) {
    let count = blockedAdsCount + adCount;
    chrome.storage.sync.set({ "blockedAdsCount": count }, callback);
  });
}

// Function to clear blockedAdsCount in storage
function clearBlockedAdsCount(callback) {
  chrome.storage.sync.set({ "blockedAdsCount": 0 }, callback);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getAdBlockerState') {
    sendResponse({ adBlockerState });
  } else if (request.action === 'setAdBlockerState') {
    setAdBlockerState(request.adBlockerState, function() {
      sendResponse({});
    });
  } else if (request.action === 'getAdsBlockedCount') {
    getBlockedAdsCount(function (count) {
      sendResponse({ blockedAdsCount: count });
    });
  } else if (request.action === 'addAdsBlockedCount') {
    addAdsBlockedCount(request.adCount, function() {
      sendResponse({});
    });
  } else if (request.action === 'clearBlockedAdsCount') {
    clearBlockedAdsCount(function() {
      sendResponse({});
    });
  }
});