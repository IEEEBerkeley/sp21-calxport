export class Section {
    constructor(course, sectionName, startDate, endDate, days, startTime, endTime, room) {
        this.course = course;
        this.section = sectionName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days;
        this.startTime = startTime;
        this.endTime = endTime;
        this.room = room;
    }
    get course() {
        return this.course;
    }
    get section() {
        return this.section;
    }
    get startDate() {
        return this.startDate;
    }
    get endDate() {
        return this.endDate;
    }
    get days() {
        return this.days;
    }
    get startTime() {
        return this.startTime;
    }
    get endTime() {
        return this.endTime;
    }
    get room() {
        return this.room;
    }
}