let getCourseButton = document.getElementById('getCourse');
let exportButton = document.getElementById('export');
// tasks: 
// 1) find out how to get chrome.tabs element (query) to return current tab info (url, etc.) 
//-> possible issue: chrome.tabs only runs in popup.html environment -> it's not a tab and thus not
// returning the current tab's info
// 2) Get popup.js send message to contentScripts.js whenever the user clicks on "Grab classes!" (for now)
getCourseButton.addEventListener("click", function () {
  // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //   console.log(tabs);
  //   console.log(chrome.runtime);
  //   if (!tabs[0].url.includes("https://bcsweb.is.berkeley.edu/")) {
  //     alert("Invalid site. Please go to CalCentral's Enrollment Center.");
  //     return;
  //   }
  //   chrome.tabs.sendMessage(tabs[0].id, {msg: "grab"}, function(response) {
  //     console.log(response.receivedStatus);
  //   });
  // });
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log(tabs);
    chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
      console.log(response.farewell);
    });
  });
}); 
