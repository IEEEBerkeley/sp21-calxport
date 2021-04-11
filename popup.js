let getCourseButton = document.getElementById('getCourse');
let exportButton = document.getElementById('export');
// tasks: 
// 1) find out how to get chrome.tabs element (query) to return current tab info (url, etc.) 
//-> possible issue: chrome.tabs only runs in popup.html environment -> it's not a tab and thus not
// returning the current tab's info
// 2) Get popup.js send message to contentScripts.js whenever the user clicks on "Grab classes!" (for now)
getCourseButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes("bcsweb.is.berkeley.edu")) {
    alert("Invalid site. Please go to CalCentral's Enrollment Center.");
    return
  }
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: injectScripts,
  })
}); 
function injectScripts() {
  console.log("hi");
}