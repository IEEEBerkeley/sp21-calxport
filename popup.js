import { scrapedData } from './scrapingScripts.js';

import {weekdays, months} from './dates.mjs';
function addCourseToTable(courseDict) {
  let table = document.getElementById('courseTable');
  for (const [sect, inf] of Object.entries(courseDict)) {
    var row = document.createElement("tr");
    Object.keys(courseDict[sect]).forEach(function (k) {
      var info = document.createElement("td");
      var node = document.createTextNode(courseDict[sect][k]);
      info.appendChild(node);
      row.appendChild(info);
    })
    table.appendChild(row);
  }
};
// IN PROGRESS!
// TODO: fix the formatting error (s is a single object aka section)
function addSectionToTable(s) {
  var table = document.getElementById('courseTable');
  console.log(s);
  console.log(Object.values(s)[0]);
  var properties = Object.values(s);
  var row = document.createElement('tr');
  for (var i = 0; i < properties.length; i += 1) {
    var cell = document.createElement('td');
    var val = document.createTextNode(properties[i]);
    cell.appendChild(val);
    row.appendChild(cell);
    console.log(properties[i]);
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
      console.log('Injection Results:' + injectionResults[0].result[0]);
      for (var i = 0; i < injectionResults[0].result.length; i += 1) {
        addSectionToTable(injectionResults[0].result[i]);
      }
      course.push(injectionResults[0].result);
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
  console.log('course: ', course);
  var courseEvents = exportData(course[0]);
  console.log(courseEvents);
  // var c1 = exportData(course[1]);
  // console.log(c1);
  var eventLength = courseEvents.length;
  var i = 0;
  chrome.identity.getAuthToken({
    interactive: true
  }, (token) => {
    // TODO: fix Rate Limit in setInterval (to maybe 1 second?)
    console.log('eventLength: ', eventLength);
    var interval = setInterval(() => {
      console.log(courseEvents[i]);
      if (courseEvents[i] == null) {
        console.log(i);
        clearInterval(interval);
      } else {
        jsonPOST("https://www.googleapis.com/calendar/v3/calendars/primary/events", token, courseEvents[i]);
        i += 1;
      }
    }, 700, courseEvents, token, i)
  })
  document.getElementById("exportmsg").style.display = 'block';
})

function checkValidEntry(entry) {
  if (entry["days"].length < 1 || typeof entry["days"] != "string") {
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
// data: array of courses
function exportData(data) {
  var events = [];
  data.forEach(courseDict => {
    //console.log(courseDict);
    var info = courseDict[Object.keys(courseDict)[0]];
    console.log(courseDict[Object.keys(courseDict)]);
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

    var currDay = weekdays[days[0]];
    var addDays = 0; //difference between startDay and the start of classes
    if (currDay - startSchool < 0) {
      addDays = (currDay - startSchool) * (-1) + 7;
    } else {
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

function exportData2(data) {
  // data arg is a list of Section objects
  var events = [];
  data.forEach(s => {
    var course = s.course;
    var days = s.days;
    var endDate = s.endDate;
    var endTime = s.endTime;
    var room = s.room;
    var section = s.section;
    var startDate = s.startDate;
    var startTime = s.startTime;

    var startSchoolArray = startDate.split('-');
    var startString = (months[startSchoolArray[0]] + " " + startSchoolArray[1] + ", " + startSchoolArray[2] + " " + startTime);
    var endString = (months[startSchoolArray[0]] + " " + startSchoolArray[1] + ", " + startSchoolArray[2] + " " + endTime);
    const startSchoolDate = new Date(startString);
    const endSchoolDate = new Date(endString);

    var finalEndDateArray = endDate.split('-');
    var finalEndString = finalEndDateArray[2] + finalEndDateArray[0] + finalEndDateArray[1] + "T000000Z";
    const startSchool = startSchoolDate.getDay();

    var currDay = weekdays[days[0]];
    var addDays = 0; //difference between startDay and the start of classes
    if (currDay - startSchool < 0) {
      addDays = (currDay - startSchool) * (-1) + 7;
    } else {
      addDays = currDay - startSchool;
    }

    var dateTimeStart = addDaysToDate(startSchoolDate, addDays).toISOString();
    var dateTimeEnd = addDaysToDate(endSchoolDate, addDays).toISOString();

    events.push(buildEvent(course, dateTimeStart, room, section, dateTimeEnd, toBYDAY(days), finalEndString));
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
  return event;
}