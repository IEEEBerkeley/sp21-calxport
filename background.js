'use strict';

chrome.runtime.onMessage.addListener(message => {
  console.log("background: onMessage", message);

  // Add this line:
  return Promise.resolve("Dummy response to keep the console quiet");
});