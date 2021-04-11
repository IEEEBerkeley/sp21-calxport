console.log("on Enrollment Center page");
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg == "grab") {
    console.log("contentScripts.js running...")
    sendResponse({receivedStatus: "received"});
  }
})