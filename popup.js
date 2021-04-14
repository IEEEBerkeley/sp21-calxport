let getCourseButton = document.getElementById('getCourse');
let exportButton = document.getElementById('export');
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
  function reformatCourseName(courseName) {
    var splitArray = courseName.split("   ");
    return splitArray
  }
  var n = 0;
  var courseHTMLElem = document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${n}`);
  while (courseHTMLElem != null) {
    courseName = reformatCourseName(courseHTMLElem.childNodes[0].nodeValue);
    console.log(courseName.join(" "));
    n += 1;
    courseHTMLElem = document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${n}`);
  }
}