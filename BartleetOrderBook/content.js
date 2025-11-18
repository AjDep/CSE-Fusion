// Try to detect watchId from page
let currentWatchId = null;

// Option 1: if there's a JS variable on the page
if (window.currentWatchId) {
    currentWatchId = window.currentWatchId;
}

// Option 2: if watchId is in URL
const urlMatch = window.location.href.match(/watchId=(\d+)/);
if (urlMatch) {
    currentWatchId = urlMatch[1];
}

// Send detected watchId to popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg === 'getWatchId') {
        sendResponse({ watchId: currentWatchId });
    }
});
