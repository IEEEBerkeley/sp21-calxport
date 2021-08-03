/** Scraping Part */
// import jQuery
var script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);
// To replace CSS selectors for jQuery
function jq(myid) {
  return "#" + myid.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
}
import {scrapedData} from './scrapingScripts.mjs';

function addCourseToTable(courseDict, tableID) {
  let table = document.getElementById('courseTable');
  for (const [sect, inf] of Object.entries(courseDict)) {
    var row = document.createElement("tr");
    Object.keys(courseDict[sect]).forEach(function(k) {
      var info = document.createElement("td");
      var node = document.createTextNode(courseDict[sect][k]);
      info.appendChild(node);
      row.appendChild(info);
    })
  table.appendChild(row);
  }
};

var course = [];
// course will be nested arrays
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
    function: scrapedData,
  },
  // gets return results from scrapedData() in scrapingScripts.js
  (injectionResults) => {
    //console.log(injectionResults[0].result);
    for (var i = 0; i < injectionResults[0].result.length; i += 1) {
      addCourseToTable(injectionResults[0].result[i], 'courseTable');
    }
    course.push(injectionResults[0].result);
  })
  courseTable.style.display = 'block';
  getCourseButton.disabled = true;
  getCourseButton.style.background = "#aaa8a5";
  getCourseButton.style.cursor = "default";
}); 
exportButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes("bcsweb.is.berkeley.edu")) {
    alert("Invalid site. Please go to CalCentral's Enrollment Center.");
    return
  }
  var courseEvents = exportData(course[0]);
  var eventLength = courseEvents.length;
  var i = 0;
  chrome.identity.getAuthToken({interactive: true}, (token) => {
    var interval = setInterval(() => {
      console.log(courseEvents[i]);
      if (i == eventLength) {
        console.log(i);
        clearInterval(interval);
      } else {
        jsonPOST("https://www.googleapis.com/calendar/v3/calendars/primary/events", token, courseEvents[i]);
        i += 1;
      }
    }, 100, courseEvents, token, i)
  })
  document.getElementById("exportmsg").style.display = 'block';
})

function checkValidEntry(entry) {
  if (entry["days"].length < 1 || typeof entry["days"] != "string" ) {
    return false;
  }
  if (entry["endDate"].length != 1 || entry["startDate"].length != 1) {
    return false;
  }
  if (entry["room"].length != 1) {
    return false;
  }
  return true;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function addDaysToDate(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toBYDAY(dayList) {
  var days = "";
  for (var i = 0; i < dayList.length; i++) {
    if (i != 0) {
      days += ",";
    }
    switch (dayList[i]) {
      case "Monday":
				days += "MO";
				break;
			case "Tuesday":
				days += "TU";
				break;
			case "Wednesday":
				days += "WE";
				break;
			case "Thursday":
				days += "TH";
				break;
			case "Friday":
				days += "FR";
				break;
      case "Saturday":
        days += "SA";
        break;
      case "Sunday":
        days += "SU"
        break;
    }
  }
  return days;
}
// data: array of courses
function exportData(data) {
  var events = [];
  data.forEach(courseDict => {
      //console.log(courseDict);
      var info = courseDict[Object.keys(courseDict)[0]];
      console.log(info);
      var course = info["course"];
      var days = info["days"];
      var endDate = info["endDate"];
      var endTime = info["endTime"];
      var room = info["room"];
      var section = info["section"];
      var startDate = info["startDate"];
      var startTime = info["startTime"];
      //start here
      var weekday = {};
      weekday["Sunday"] = 0;
      weekday["Monday"] = 1;
      weekday["Tuesday"] = 2;
      weekday["Wednesday"] = 3;
      weekday["Thursday"] = 4;
      weekday["Friday"] = 5;
      weekday["Saturday"] = 6;

      var months = {};
      months["01"] = "January";
      months["02"] = "February";
      months["03"] = "March";
      months["04"] = "April";
      months["05"] = "May";
      months["06"] = "June";
      months["07"] = "July";
      months["08"] = "August";
      months["09"] = "September";
      months["10"] = "October";
      months["11"] = "November";
      months["12"] = "December";


      // Sunday - Saturday : 0 - 6
      //const birthday = new Date('August 19, 1975 23:15:30');
      //startDate: "01-19-2021"
      //startTime: "14:00:00"
      var startSchoolArray = startDate.split('-');
      var startString = (months[startSchoolArray[0]] + " " + startSchoolArray[1] + ", " + startSchoolArray[2] + " " + startTime);
      var endString = (months[startSchoolArray[0]] + " " + startSchoolArray[1] + ", " + startSchoolArray[2] + " " + endTime);
      const startSchoolDate = new Date(startString);
      const endSchoolDate = new Date(endString);

      // RRULE:FREQ=DAILY;UNTIL=19971224T000000Z

      var finalEndDateArray = endDate.split('-');
      var finalEndString = finalEndDateArray[2] + finalEndDateArray[0] + finalEndDateArray[1] + "T000000Z";
      var testingFES = finalEndString.split("\n");
      const startSchool = startSchoolDate.getDay();

      var currDay = weekday[days[0]];
      var addDays = 0; //difference between startDay and the start of classes
      if (currDay - startSchool < 0) {
        addDays = (currDay - startSchool) * (-1) + 7;
      }
      else {
        addDays = currDay - startSchool;
      }
      //example of dateTime '2013-02-14T13:15:03-08:00' 
      //https://developers.google.com/gmail/markup/reference/datetime-formatting#javascript
      
      var dateTimeStart = addDaysToDate(startSchoolDate, addDays).toISOString();
      var dateTimeEnd = addDaysToDate(endSchoolDate, addDays).toISOString();

      events.push(buildEvent(course, dateTimeStart, room, section, dateTimeEnd, toBYDAY(days), finalEndString));
    

      //TODO: configure and use buildEvent to build JSON message to send event
      // chrome.identity.getAuthToken({interactive: true}, (token) => {
      //jsonPOST("https://www.googleapis.com/calendar/v3/calendars/primary/events", token, {INSERT buildEvent HERE})
      //})
  })
  return events;

} 


//removed days from buildEvent
function buildEvent(course, dateTimeStart, room, sect, dateTimeEnd, dayRecurrStr, endSchoolDate) {
  var event = {
    'summary': course + " - " + sect,
    'start': {
      'dateTime': dateTimeStart,
      'timeZone': 'America/Los_Angeles'
    },
    'end': {
      'dateTime': dateTimeEnd,
      'timeZone': 'America/Los_Angeles'
    },
    'recurrence': [
      `RRULE:FREQ=WEEKLY;BYDAY=${dayRecurrStr};UNTIL=${endSchoolDate}`
    ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10}
      ]
    }
  };
  return event;
}
