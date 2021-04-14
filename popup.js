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
    function: scrapingScripts,
  })
}); 

exportButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes("bcsweb.is.berkeley.edu")) {
    alert("Invalid site. Please go to CalCentral's Enrollment Center.");
    return
  }
  chrome.scripting.executeScript({
    target: { tabID: tab.id },
    function: newAddEvent('math','2021-04-03T03:00:00-07:00','2021-04-03T05:00:00-07:00'),
  })
})
function scrapingScripts() {
  /** Removes excessive spaces between words in course name */
  function reformatCourseName(courseName) {
    var splitArray = courseName.split("   ");
    return splitArray
  }
  var n = 0;
  /** Grabs course name HTML element*/
  var courseHTMLElem = document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${n}`);
  while (courseHTMLElem != null) {
    courseName = reformatCourseName(courseHTMLElem.childNodes[0].nodeValue);
    /** Joins the split string in array into a string with proper spacing format */
    console.log(courseName.join(" "));
    n += 1;
    courseHTMLElem = document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${n}`);
  }
}