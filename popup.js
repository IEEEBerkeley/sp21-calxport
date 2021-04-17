var CLIENT_ID = '806985070719-8sillfgbsvbfn4a4nt7in4cjt2pqq4nq.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDMYUAibKEqBlX4k2WtVdu-iktw7JAFy5A';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/calendar";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';

    newAddEvent('math','2021-04-03T03:00:00-07:00','2021-04-03T05:00:00-07:00');
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}


function newAddEvent(className, dateTimeStart, dateTimeEnd) {
  var event = {
    'summary': className,
    'start': {
      'dateTime': dateTimeStart,
      'timeZone': 'America/Los_Angeles'
    },
    'end': {
      'dateTime': dateTimeEnd,
      'timeZone': 'America/Los_Angeles'
    },
    'recurrence': [
      'RRULE:FREQ=WEEKLY;COUNT=15'
    ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10}
      ]
    }
  };

  var request = gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event
  });

  request.execute(function(event) {
    appendPre('Event created: ' + event.htmlLink);

  });
}

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