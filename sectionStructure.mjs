export class Section {
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