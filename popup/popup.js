document.addEventListener("DOMContentLoaded", function () {
  let powerButton = document.querySelector(".powerButton");
  let clearStatsButton = document.querySelector("#clearStats");

  chrome.storage.sync.get("adBlockerState", function (data) {
    let adBlockerState = data.adBlockerState;
    updateButtonState(adBlockerState);
  });

  powerButton.addEventListener("click", function () {
    chrome.storage.sync.get("adBlockerState", function (data) {
      let adBlockerState = data.adBlockerState;

      adBlockerState = !adBlockerState;

      chrome.runtime.sendMessage({ action: 'setAdBlockerState', adBlockerState });
    
      updateButtonState(adBlockerState);
    });
  });

  function updateButtonState(adBlockerState) {
    if (adBlockerState) {
      powerButton.classList.add("on");
    } else {
      powerButton.classList.remove("on");
    }
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateAdsBlockedCount') {
      DisplayAdsBlocked(request.adsBlockedCount);
    }
  });

  function DisplayAdsBlocked(adsBlockedCount) {
    adsBlocked.textContent = adsBlockedCount;
  }

  chrome.storage.sync.get("blockedAdsCount", function (data) {
    let count = data.blockedAdsCount || 0;
    DisplayAdsBlocked(count);
  });

  clearStatsButton.addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: 'clearBlockedAdsCount' })
    DisplayAdsBlocked(0);
  });
});
