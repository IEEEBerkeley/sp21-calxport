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

  function formatStartEndDates(arr) {
    var startDate = arr[0].split("/").join("-");
    var endDate = arr[1].split("/").join("-");
    return [startDate, endDate]
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

  function formatTime(timeString) {
    if (timeString.includes("AM")) {
  
      var onlyTime = timeString.substring(0, timeString.indexOf("AM")) + ":00";
      var splitArray = onlyTime.split(":");
      if (splitArray[0] == "12") {
        splitArray[0] = "00";
      }
      return splitArray.join(":");
    } else {
      var onlyTime = timeString.substring(0, timeString.indexOf("PM")) + ":00";
      var splitArray = onlyTime.split(":");
      if (splitArray[0] != "12") {
        var hour = parseInt(splitArray[0]);
        splitArray[0] = `${hour + 12}`;
      }
      return splitArray.join(":");
    }
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
      sectionInfo["startDate"] = formatStartEndDates(getStartEndDates(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`))[0];
      sectionInfo["endDate"] = formatStartEndDates(getStartEndDates(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`))[1].trim();
      sectionInfo["days"] = getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[0];
      sectionInfo["startTime"] = formatTime(getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1][0]);
      sectionInfo["endTime"] = formatTime(getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1][1]);
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
  console.log(courseList);
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
    function: scrapingScripts,
  },
  // gets return results from scrapingScripts()
  (injectionResults) => {
    //console.log(injectionResults[0].result);
    for (var i = 0; i < injectionResults[0].result.length; i += 1) {
      addCourseToTable(injectionResults[0].result[i], 'courseTable');
    }
    course.push(injectionResults[0].result);
  })
  courseTable.style.display = 'block';
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

    // for (var i = 0; i < courseEvents.length; i++) {
    //   jsonPOST("https://www.googleapis.com/calendar/v3/calendars/primary/events", token, courseEvents[i])
    // }

    var interval = setInterval(() => {
      if (i == eventLength) {
        console.log(courseEvents[i]);
        clearInterval(interval);
      } else {
        jsonPOST("https://www.googleapis.com/calendar/v3/calendars/primary/events", token, courseEvents[i])
        i += 1;
      }
    }, 4000, courseEvents, token, i)

  })
  
})

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
      console.log(courseDict);
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
      var finalEndString = finalEndDateArray[2] + startSchoolArray[0] + startSchoolArray[1] + "T000000Z";
      console.log(finalEndString);
      
      const startSchool = startSchoolDate.getDay();

      for (var i = 0; i < days.length; i++) {
        var currDay = weekday[days[i]];
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
      }

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
/*
function buildEvent(course, days, dateTimeStart, room, sect, dateTimeEnd, timezone) {
  var event = {
    'summary': course,
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
  return event;
}
*/
