try {
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
  
  /** Scraping Part */
  
  function scrapingScripts() {
    var courseList = [];
    /** NOTE: need to replace these codes with function calls for the simplicity of codes (currently unable to do so) */
    function getCourseName(courseIdx) {
      /** Grabs course name HTML element*/
      var courseHTMLElem = document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${courseIdx}`);
      return courseHTMLElem.innerText;
    }
  
    function getSectionName(node) {
      var sectionName = getElementStringInRow(node, 0)
      var splitArray = sectionName.split(" - ");
      return splitArray[0];
    }
  
    /** Returns an array of start and end dates 
     * Index 0: start date
     * Index 1: end date
     */
    function getStartEndDates(node) {
      var dates = getElementStringInRow(node, 1);
      var splitArray = dates.split(" - ");
      return [splitArray[0], splitArray[1]];
    }
  
    /** Returns an array of days and times of a class
     * Index 0: array of all the days of the class
     * Index 1: array of start time (index 0) and end time (index 1)
     */
    function getDaysTimes(node) {
      var dtString = getElementStringInRow(node, 2);
      var dtArray = dtString.split("\n");
      //console.log("dtArray 0: " + dtArray[0]);
      //console.log("dtArray 1: " + dtArray[1]);
      //"Schedule: To Be Announced case"
      if (dtArray.length == 1) {
        return null;
      }
  
      var dayArray = dtArray[0].split(" ");
      var timeArray = dtArray[1].split(" ");
      dayArray.shift();
      timeArray.shift();
      if (dayArray.join(" ") == "To be Announced") {
        return null;
      }
      if (timeArray.join(" ") == "To be Announced") {
        return null;
      }
      timeArray = [timeArray[0], timeArray[2]]
      return [dayArray, timeArray]
    }
    
    function getRoom(node) {
      return getElementStringInRow(node, 3);
    }
  
    /** Get specific element in the course row (in course table) */
    function getElementStringInRow(parentNode, gridCellIdx) {
      var element = document.getElementById(parentNode).getElementsByClassName("ps_grid-cell")[gridCellIdx].innerText;
      return element;
    }
  
    /** Get course name and all related sections and their info */
    function getCourseInfo(courseIdx) {
      var courseInfo = {};
      for (var row = 0; document.getElementById(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`) != null; row += 1) {
        var sectionInfo = {};
        var section =  getSectionName(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`);
        
        //ADD WARNING TO USER FOR IT
        if (getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`) == null) {
          continue;
        }
        sectionInfo["course"] = getCourseName(courseIdx);
        sectionInfo["section"] = section;
        sectionInfo["startDate"] = getStartEndDates(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[0];
        sectionInfo["endDate"] = getStartEndDates(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1].trim();
        sectionInfo["days"] = getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[0];
        sectionInfo["startTime"] = getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1][0];
        sectionInfo["endTime"] = getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1][1];
        sectionInfo["room"] = getRoom(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`).trim();
        courseInfo[`${section}`] = sectionInfo
      }
      return courseInfo;
    }
    for (var i = 0; document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${i}`) != null; i += 1) {
      /** Ignores dropped classes */
      if (document.getElementById(`DERIVED_SSR_FL_SSR_DRV_STAT$392$$${i}`).innerText == "Dropped") {
        continue;
      }
      courseList.push(getCourseInfo(i));
    }
    return courseList;
  }
  function addCourseToTable(courseDict, tableID) {
    let table = document.getElementById('courseTable');
    for (const [sect, inf] of Object.entries(courseDict)) {
      var row = document.createElement("tr");
      // for (const [k, v] of Object.entries(courseDict[sect]))
      // {
      //   var info = document.createElement("td");
      //   var node = document.createTextNode(v);
      //   info.appendChild(node);
      //   row.appendChild(info);
      //   console.log(info)
      // }
      // console.log(inf)
      Object.keys(courseDict[sect]).forEach(function(k) {
        var info = document.createElement("td");
        var node = document.createTextNode(courseDict[sect][k]);
        info.appendChild(node);
        row.appendChild(info);
      })
    table.appendChild(row);
    }
  }
  
  let getCourseButton = document.getElementById('getCourse');
  let exportButton = document.getElementById('export');
  let courseTable = document.getElementById('courseTable');
  getCourseButton.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.url.includes("bcsweb.is.berkeley.edu")) {
      alert("Invalid site. Please go to CalCentral's Enrollment Center.");
      return
    }
    exportButton.style.display = 'block';
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapingScripts,
    },
    // gets return results from scrapingScripts()
    (injectionResults) => {
      console.log(injectionResults[0].result);
      for (var i = 0; i < injectionResults[0].result.length; i += 1) {
        addCourseToTable(injectionResults[0].result[i], 'courseTable');
      }
    })
    courseTable.style.display = 'block';
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
} catch (error) {
  console.log("Error: " + error);
}
// setTimeout(() => {
//   console.log(document.querySelector("iframe").contentWindow.postMessage("PING", "*"));
  
// }, 5000)

// window.addEventListener('message', e => {
// 	console.log(e);
//     e.source.postMessage('PING', e.origin === 'null' ? '*' : e.origin );
// });

let IFRAME = document.querySelector('iframe');

// Front end
function post(messageType, data) {
  return new Promise(resolve => {
    const handler = event => {
      const { type, data } = event.data;
      if (type === messageType) {
        window.removeEventListener('message', handler);
        resolve(data);
      }
    };
    window.addEventListener('message', handler);
  	IFRAME.contentWindow.postMessage({
      type: messageType,
      data: data
    }, '*');
  });
}

// setTimeout(() => {
//   (async function(){
//     console.log(await post('ping', 12345));
//   })()
//   }, 5000)

// NOTE: requires body properties to args.
function jsonPOST(url, authToken, body={}, query = '') {
  // VERY CRITICAL
  // url = URL
  // authToken = token
  // body = JSON object
  // query = JSON object
  /*
  {
  	'data': 1234
  }
  
  converts into data=1234
  */
  if (query) {
  	query = '?' + Object.entries(query).map(([key, value]) => key + '=' + value).join('&');
  }
	return fetch(url + query, {
  	method: 'POST',
    headers: {
    	'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(body)
  }).then(res => res.json());
}
function jsonGET(url, authToken, body={}, query = '') {
  // VERY CRITICAL
  // url = URL
  // authToken = token
  // body = JSON object
  // query = JSON object
  /*
  {
  	'data': 1234
  }
  
  converts into data=1234
  */
  if (query) {
  	query = '?' + Object.entries(query).map(([key, value]) => key + '=' + value).join('&');
  }
	return fetch(url + query, {
  	method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
  }).then(res => res.json());
}
// get authToken
chrome.identity.getAuthToken({interactive:true}, console.log)