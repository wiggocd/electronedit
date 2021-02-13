import { nextTick } from "process";

export function formatText(text: string): string {
    var ret = '';
    const inputLength = text.length;
    const tab = '    ';
    const tabLength = tab.length;

    for (var i=0; i<inputLength; i++) {
        var str: string;
        if (i+tabLength<inputLength) {
            if (text.substr(i, tabLength) == tab) {
                str = '&emsp;';
            } else {
                str = text[i];
            }
        } else {
            str = text[i];
        }
        ret += str;
    }

    return ret;
}