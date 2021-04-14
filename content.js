console.log("on Enrollment Center page");
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // if (request.msg == "grab") {
  //   console.log("contentScripts.js running...")
  //   sendResponse({receivedStatus: "received"});
  // }
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      if (request.greeting == "hello")
        sendResponse({farewell: "goodbye"});
    }
  );  
})