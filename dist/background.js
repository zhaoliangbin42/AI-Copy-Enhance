const SUPPORTED_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "gemini.google.com"
];
function isSupportedUrl(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return SUPPORTED_HOSTS.some((host) => hostname.endsWith(host));
  } catch (e) {
    return false;
  }
}
async function updateActionState(tabId, url) {
  if (isSupportedUrl(url)) {
    await chrome.action.setIcon({
      tabId,
      path: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    });
    await chrome.action.setPopup({ tabId, popup: "" });
  } else {
    await chrome.action.setIcon({
      tabId,
      path: {
        "16": "icons/icon16_gray.png",
        "48": "icons/icon48_gray.png",
        "128": "icons/icon128_gray.png"
      }
    });
    await chrome.action.setPopup({ tabId, popup: "src/popup/popup.html" });
  }
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateActionState(tabId, tab.url);
  }
});
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  updateActionState(activeInfo.tabId, tab.url);
});
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") ; else if (details.reason === "update") ;
});
chrome.runtime.onStartup.addListener(() => {
});
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "openBookmarkPanel" });
  }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "ping":
      sendResponse({ status: "ok" });
      break;
    default:
      sendResponse({ status: "unknown message type" });
  }
  return true;
});
