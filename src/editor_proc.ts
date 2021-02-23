import { ipcRenderer } from 'electron';
import { File } from './files';
import $ from 'jquery';

const tab = '    ';
const tabLength = tab.length;

export function processNewline(event: JQuery.KeyDownEvent): boolean {
    event.preventDefault();
    const el = document.getElementById('main-editor');
    const sel = window.getSelection();

    var range = new Range();
    range.setStart(sel.anchorNode, 0);
    range.setEnd(sel.anchorNode, sel.anchorOffset);

    const rangeString = range.toString();
    const rangeSplit = rangeString.split('\n');
    const lineData = rangeSplit ? rangeSplit[rangeSplit.length-1] : rangeString;

    var spaceCount = 0;
    for (var i=0; i<lineData.length; i++) {
        if (lineData[i] == ' ') { spaceCount++; } else break;
    }

    console.log(spaceCount);
    const tabCount = Math.floor(spaceCount / tabLength);
    const insertTab = tabCount > 0;
    if (insertTab) {
        document.execCommand('insertLineBreak');
        for (var i=0; i<tabCount; i++) { document.execCommand('insertHTML', false, tab); }
    } else {
        document.execCommand('insertLineBreak');
    }

    return false;
}

export function processTab(event: JQuery.KeyDownEvent): boolean {
    event.preventDefault();
    const sel = window.getSelection();

    // Todo: proess outdents and multiline tabbing
    if (sel.anchorNode != sel.focusNode) {
        if (event.shiftKey) {

        } else {
            const anchor = sel.anchorNode as any;
            var range = new Range();
            range.setStart(sel.anchorNode, 0);
            range.setEnd(sel.anchorNode, anchor.length);
            const line = range.toString();

            var firstLineWhitespace = '';
            for (var i=0; i<line.length; i++) {
                if (line[i] == ' ') { firstLineWhitespace += ' '; } else break;
            }

            const lineRange = sel.getRangeAt(0);
            const lines = lineRange.toString().split(firstLineWhitespace);
            const whitespaceLength = firstLineWhitespace.length;

            const parent = sel.anchorNode.parentNode;
            const childNodes = parent.childNodes;
            var anchorIndex: number;
            var focusIndex: number;

            childNodes.forEach((value, i, _parent) => {
                if (value == sel.anchorNode) {
                    anchorIndex = i;
                } else if (value == sel.focusNode) {
                    focusIndex = i;
                }
            });

            if (anchorIndex || focusIndex) {
                const nodeStartIndex = anchorIndex > focusIndex ? focusIndex : anchorIndex;

                var lastRanges: Range[] = [];
                for (var j=0; j<sel.rangeCount; j++) {
                    lastRanges.push(sel.getRangeAt(j));
                }

                // 2 nodes per line for line breaks
                for (var i=nodeStartIndex; i<nodeStartIndex+lines.length*2; i+=2) {
                    const node = childNodes[i] as any;
                    const offset = whitespaceLength < node.length ? whitespaceLength : 0;
                    var range = new Range();
                    range.setStart(node, offset);
                    range.setEnd(node, offset);

                    sel.removeAllRanges();
                    sel.addRange(range);
                    insertTab();
                }

                sel.removeAllRanges();
                console.log(lastRanges);
                lastRanges.forEach((value, _i, _arr) => {
                    sel.addRange(value);
                });
            }
        }
    } else if (event.shiftKey) {
        const anchor = sel.anchorNode as any;
        var range = new Range();
        range.setStart(sel.anchorNode, 0);
        range.setEnd(sel.anchorNode, anchor.length);
        const line = range.toString();

        var spaceCount = 0;
        for (var i=0; i<line.length; i++) {
            if (line[i] == ' ') { spaceCount++; } else break;
        }

        const tabCount = Math.floor(spaceCount / tabLength);
        const outdent = tabCount > 0;
        if (outdent) {
            const anchorNode = sel.anchorNode;
            const lastRange = sel.getRangeAt(0);
            sel.removeAllRanges();
            var tabEnd = new Range();
            tabEnd.setStart(anchorNode, spaceCount);
            tabEnd.setEnd(anchorNode, spaceCount);
            sel.addRange(tabEnd);

            processBackspace(null);

            sel.removeAllRanges();
            sel.addRange(lastRange);
        }
    } else {
        insertTab();
    }

    return false;
}

export function insertTab() {
    document.execCommand('insertHTML', false, tab);
}

export function processBackspace(_event: JQuery.KeyDownEvent): boolean {
    var sel = window.getSelection();
    var tabRange = new Range();

    const endOffset = sel.anchorOffset;
    const startOffset = endOffset > 0 ? endOffset - tabLength : endOffset;
    tabRange.setStart(sel.anchorNode, startOffset);
    tabRange.setEnd(sel.anchorNode, endOffset);

    const deleteTab = tabRange.toString() == tab;
    if (deleteTab) {
        sel.removeAllRanges();
        sel.addRange(tabRange);
        document.execCommand('delete', false);
        return false;
    } else {
        return true;
    }
}

export function update(file: File) {
    $('.inner', '#main-editor')[0].innerText = file.text;
    $('#main-editor').show();
    $('#editor-welcome').hide();
    updatePath(file);
}

export function updatePath(file: File) {
    $('#navigationbar').children()[0].innerText = file.path;
    $('#navigationbar').show();
}

export function write(_file: File) {
    const el = $('.inner', '#main-editor')[0];
    ipcRenderer.send('editorWriteReturn', el.innerText);
}

export function close(_file: File) {
    $('.inner', '#main-editor')[0].innerText = '';
    $('#navigationbar').children()[0].innerText = '';

    $('#main-editor').hide();
    $('#navigationbar').hide();
    $('#editor-welcome').show();
}