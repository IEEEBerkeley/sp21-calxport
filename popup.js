import { scrapedData } from './scrapingScripts.js';

import {weekdays, months} from './dates.mjs';
function addSectionToTable(s) {
  var table = document.getElementById('courseTable');
  //var properties = Object.values(s);
  var properties = [s.course, s.sectionName, s.startDate, s.endDate, s.days, s.startTime, s.endTime, s.room]
  var row = document.createElement('tr');
  for (var i = 0; i < properties.length; i += 1) {
    var cell = document.createElement('td');
    var val = document.createTextNode(properties[i]);
    cell.appendChild(val);
    row.appendChild(cell);
  }
  table.appendChild(row);
}

var course = [];
// course will be nested arrays
let getCourseButton = document.getElementById('getCourse');
let exportButton = document.getElementById('export');
let courseTable = document.getElementById('courseTable');
getCourseButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (!tab.url.includes("bcsweb.is.berkeley.edu")) {
    alert("Invalid site. Please go to CalCentral's Enrollment Center.");
    return
  }
  exportButton.style.display = 'block';
  chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      function: scrapedData,
    },
    // gets return results from scrapedData() in scrapingScripts.js
    (injectionResults) => {
      // injectionResults[0].result[n] shows [object Object]
      // for all n-long array of cL2
      for (var i = 0; i < injectionResults[0].result.length; i += 1) {
        // this for loop executes after everything outside is done executing
        let s = injectionResults[0].result[i];
        addSectionToTable(s);
        course.push(s);
      }
    })
  courseTable.style.display = 'block';
  getCourseButton.disabled = true;
  getCourseButton.style.background = "#aaa8a5";
  getCourseButton.style.cursor = "default";
});
exportButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (!tab.url.includes("bcsweb.is.berkeley.edu")) {
    alert("Invalid site. Please go to CalCentral's Enrollment Center.");
    return
  }
  var sectionEvents = exportData2(course);
  var eventLength = sectionEvents.length;
  var i = 0;
  chrome.identity.getAuthToken({
    interactive: true
  }, (token) => {
    // TODO: fix Rate Limit in setInterval (to maybe 1 second?)
    console.log('eventLength: ', eventLength);
    var interval = setInterval(() => {
      if (sectionEvents[i] == null) {
        clearInterval(interval);
      } else {
        jsonPOST("https://www.googleapis.com/calendar/v3/calendars/primary/events", token, sectionEvents[i]);
        i += 1;
      }
    }, 700, sectionEvents, token, i)
  })
  document.getElementById("exportmsg").style.display = 'block';
})

let IFRAME = document.querySelector('iframe');

// Front end
function post(messageType, data) {
  return new Promise(resolve => {
    const handler = event => {
      const {
        type,
        data
      } = event.data;
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
function jsonPOST(url, authToken, body = {}, query = '') {
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

function jsonGET(url, authToken, body = {}, query = '') {
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
chrome.identity.getAuthToken({
  interactive: true
}, console.log)

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
/** Convert a string of Enrollment Center's date to Google Calendar-readable date
 * Following this format: 'August 19, 1975'
 * Sunday - Saturday : 0 - 6
   const birthday = new Date('August 19, 1975 23:15:30');
   startDate: "01-19-2021"
   startTime: "14:00:00"
 */
function dateConverter(dateString) {
  var dateArr = dateString.split('-');
  if (dateArr.length < 3) {
    console.log("THE DATE FORMAT OF ENROLLMENT CENTER IS INVALID");
    console.log("Got: " + dateString);
  }
  return months[dateArr[0]] + " " + dateArr[1] + " " + dateArr[2]
}
function exportData2(data) {
  // data arg is a list of Section objects
  var events = [];
  for (var i = 0; i < data.length; i += 1) {
    let course = data[i]['course'];
    let days = data[i]['days'];
    let endDate = data[i]['endDate'];
    let endTime = data[i]['endTime'];
    let room = data[i]['room'];
    let sectionName = data[i]['sectionName'];
    let startDate = data[i]['startDate'];
    let startTime = data[i]['startTime'];

    var startString = dateConverter(startDate) + " " + startTime;
    var endString = dateConverter(startDate) + " " + endTime;
    const startSchoolDate = new Date(startString);
    const endSchoolDate = new Date(endString);

    var finalEndDateArray = endDate.split('-');
    var finalEndString = finalEndDateArray[2] + finalEndDateArray[0] + finalEndDateArray[1] + "T000000Z";
    const startSchoolDay = startSchoolDate.getDay();

    var currDay = weekdays[days[0]];
    var addDays = 0; //difference between startDay and the start of classes
    if (currDay - startSchoolDay < 0) {
      addDays = (currDay - startSchoolDay) * (-1) + 7;
    } else {
      addDays = currDay - startSchoolDay;
    }
    var dateTimeStart = addDaysToDate(startSchoolDate, addDays).toISOString();
    var dateTimeEnd = addDaysToDate(endSchoolDate, addDays).toISOString();

    events.push(buildEvent(course, dateTimeStart, room, sectionName, dateTimeEnd, toBYDAY(days), finalEndString));
  }
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
      'overrides': [{
          'method': 'email',
          'minutes': 24 * 60
        },
        {
          'method': 'popup',
          'minutes': 10
        }
      ]
    }
  };
  if (room != 'To be Announced') {
    event['location'] = room;
  }
  return event;
}