/**
 * Background service worker for Chrome Extension
 * Handles extension lifecycle and background tasks
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // console.log('[AICopyEnhance] Extension installed');led');
  } else if (details.reason === 'update') {
    // console.log('[AICopyEnhance] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

chrome.runtime.onStartup.addListener(() => {
  // console.log('[AICopyEnhance] Extension started');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // console.log('[AICopyEnhance] Message received:', message);
  
  // Handle different message types here if needed
  switch (message.type) {
    case 'ping':
      sendResponse({ status: 'ok' });
      break;
    default:
      sendResponse({ status: 'unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});
