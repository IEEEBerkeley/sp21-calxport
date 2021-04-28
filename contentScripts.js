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