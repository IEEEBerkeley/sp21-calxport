let alertButton = document.getElementById('getCourse');
// tasks: 
// 1) find out how to get chrome.tabs element (query) to return current tab info (url, etc.) 
//-> possible issue: chrome.tabs only runs in popup.html environment -> it's not a tab and thus not
// returning the current tab's info
// 2) Get popup.js send message to contentScripts.js whenever the user clicks on "Grab classes!" (for now)
alertButton.addEventListener("click", function () {
  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //   chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
  //     console.log(response.farewell);
  //   });
  // });
  console.log(chrome.tabs);
  console.log("clicked on grab classes!")
}); 
