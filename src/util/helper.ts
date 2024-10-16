function addDays(str: string, days: string) {
    var myDate = new Date(str);
    myDate.setDate(myDate.getDate() + parseInt(days));
    return myDate;
}

export function dateOnly(date: any, type: "start" | "end") {
    if (type === "start") {
        return addDays(`${date.split("T")[0]}T00:00:00Z`, '1');
    } else if (type === "end") {
        return addDays(`${date.split("T")[0]}T23:59:59Z`, '-1');
    }
}

export function generatePassword() {
    var length = 8,
        charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

export function isID(id: string) {
    return /^[0-9]+$/.test(id);
}
/* export function compareObjects(original: any[], edited: Object[]) {
    // const added = edited.filter(item => !original.includes(item));
    // const removed = original.filter(item => !(added.includes(item) && edited.includes(item)));
    // return { added, removed };

    const added = edited.filter(item => !original.includes(item));
    const removed = original.filter(item => !edited.includes(item));
    return { added, removed };
} */