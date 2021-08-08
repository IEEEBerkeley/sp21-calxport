export function scrapedData() {
  class Section {
    constructor(course, sectionName, startDate, endDate, days, startTime, endTime, room) {
        this.course = course;
        this.sectionName = sectionName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
    }
}
  var cL2 = [];
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
   * Returns either nested arrays, a single array of strings, or null
   */
  function getDaysTimes(node) {
    // Can handle special cases
    var dtString = getElementStringInRow(node, 2);
    //console.log(dtString);
    var dtArray = dtString.split("\n");
    //console.log(dtArray);
    if (dtArray.length > 2) {
      return dtArray;
    }
    return processDayTimeArray(dtArray);
  }

  function processDayTimeArray(arr) {
    // Only handles normal cases + TBA cases
    //"Schedule: To Be Announced case"
    if (arr.length == 1) {
      return null;
    }

    var dayArray = arr[0].split(" ");
    var timeArray = arr[1].split(" ");
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

  /** Get info of section */
  function getSectionInfo(courseIdx, row) {
    // NOTE: Section is an object!
    //ADD WARNING TO USER FOR IT
    if (getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`) == null) {
      return null;
    }
    if (getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`).length > 2) {
      // ignore incorrect cases (WARNING: WHAT ARE INCORRECT CASES?)
      return null;
    }
    section = new Section();
    section.course = getCourseName(courseIdx);
    section.sectionName = getSectionName(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`);
    section.startDate = formatStartEndDates(getStartEndDates(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`))[0];
    section.endDate = formatStartEndDates(getStartEndDates(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`))[1].trim();
    section.days = getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[0];
    section.startTime = formatTime(getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1][0]);
    section.endTime = formatTime(getDaysTimes(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`)[1][1]);
    section.room = getRoom(`STDNT_ENRL_SSVW$${courseIdx}_row_${row}`).trim();
    return section;
  }
  for (var i = 0; document.getElementById(`DERIVED_SSR_FL_SSR_SCRTAB_DTLS$${i}`) != null; i += 1) {
    /** Ignores dropped classes */
    if (document.getElementById(`DERIVED_SSR_FL_SSR_DRV_STAT$392$$${i}`).innerText == "Dropped") {
      continue;
    }
    for (var row = 0; document.getElementById(`STDNT_ENRL_SSVW$${i}_row_${row}`) != null; row += 1) {
      cL2.push(getSectionInfo(i, row));
    }
  }
  return cL2;
}