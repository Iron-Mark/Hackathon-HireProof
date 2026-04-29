// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scanWithHireProof",
    title: "Scan with HireProof",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scanWithHireProof" && info.selectionText) {
    const text = info.selectionText;
    
    // Open the HireProof web app in a new tab with the selected text
    // This provides the best UX as it takes the user directly to the full investigation
    const url = `https://hireproof-sigma.vercel.app/audit?text=${encodeURIComponent(text)}`;
    
    chrome.tabs.create({ url });
  }
});
