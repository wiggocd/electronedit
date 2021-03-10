import { ipcRenderer } from 'electron';
import { File } from './files';
import $ from 'jquery';

const tab = '    ';
const tabLength = tab.length;

export function processNewline(event: JQuery.KeyDownEvent): boolean {
    event.preventDefault();
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

    // Todo: complete multiline tab handling
    if (sel.anchorNode != sel.focusNode || sel.anchorNode == $('.inner', '#main-editor')[0]) {
        tabMultiline(event.shiftKey);
    } else if (event.shiftKey) {
        outdent();
    } else {
        indent();
    }

    return false;
}

function indent() {
    document.execCommand('insertHTML', false, tab);
}

function outdent() {
    const sel = window.getSelection();
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
}

function tabMultiline(outdent: boolean = false) {
    const sel = window.getSelection();
    const anchorOffset = sel.anchorOffset;
    const focusOffset = sel.focusOffset;
    const lastRanges: Range[] = [];
    for (var i=0; i<sel.rangeCount; i++) { lastRanges.push(sel.getRangeAt(i)) }

    const el = $('.inner', '#main-editor')[0];
    var nodes: Node[] = [];
    el.childNodes.forEach((node, _i, _list) => {
        nodes.push(node);
    });

    
    var selectedNodes: Node[];
    const anchorIndex = nodes.indexOf(sel.anchorNode);
    const focusIndex = nodes.indexOf(sel.focusNode);
    const validNodes = anchorIndex != -1 && focusIndex != -1;
    if (validNodes) {
        selectedNodes = focusIndex > anchorIndex ? nodes.slice(anchorIndex, focusIndex + 1)
                        : nodes.slice(focusIndex, anchorIndex + 1);
    } else if (anchorIndex == -1 && focusIndex != -1) {
        selectedNodes = focusOffset > anchorOffset ? nodes.slice(anchorOffset, focusIndex + 1)
                        : nodes.slice(focusIndex, anchorOffset + 1);
    } else if (anchorIndex != -1 && focusIndex == -1) {
        selectedNodes = focusOffset > anchorOffset ? nodes.slice(anchorIndex, focusOffset + 1)
                        : nodes.slice(focusOffset, anchorIndex + 1);
    } else {
        selectedNodes = focusOffset > anchorOffset ? nodes.slice(anchorOffset, focusOffset)
                        : nodes.slice(focusOffset, anchorOffset);
    }

    if (selectedNodes.length > 1) {
        var outdented = false;
        selectedNodes.forEach((node, _i, _arr) => {
            if (outdent) {
                const anchor = node as any;
                var range = new Range();
                range.setStart(anchor, 0);
                range.setEnd(anchor, anchor.length);
                const line = range.toString();

                var spaceCount = 0;
                for (var j=0; j<line.length; j++) {
                    if (line[j] == ' ') { spaceCount++; } else break;
                }

                const tabCount = Math.floor(spaceCount / tabLength);
                if (tabCount > 0) {
                    node.textContent = node.textContent.substr(tabLength, node.textContent.length);
                    outdented = true;
                }
            } else {
                node.textContent = tab + node.textContent;
            }
        });

        if (validNodes) {
            var firstRange = new Range();
            if (focusIndex > anchorIndex) {
                firstRange.setStart(sel.anchorNode, sel.anchorOffset);
                if (outdent && outdented) {
                    firstRange.setEnd(sel.focusNode, focusOffset - tabLength);
                } else if (!outdent) {
                    firstRange.setEnd(sel.focusNode, focusOffset + tabLength);
                }
            } else {
                firstRange.setStart(sel.focusNode, sel.focusOffset);
                if (outdent && outdented) {
                    firstRange.setEnd(sel.anchorNode, anchorOffset - tabLength);
                } else if (!outdent) {
                    firstRange.setEnd(sel.anchorNode, anchorOffset + tabLength);
                }
            }

            if ((outdent && outdented) || !outdent) {
                sel.removeAllRanges();
                lastRanges.forEach((range, _i, _arr) => {
                    sel.addRange(range);
                });
                sel.removeRange(sel.getRangeAt(0));
                sel.addRange(firstRange);
            }
        }
    }
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
        for (var i=0; i<4; i++) {
            document.execCommand('delete', false);
        } 
    } else {
        document.execCommand('delete', false);
    }

    return false;
}

export function undo() {
    document.execCommand('undo');
    updateWithTimeout();
}

export function redo() {
    document.execCommand('redo');
    updateWithTimeout();
}

export function updateWithTimeout() {
    setTimeout(function() {
        updateMargin();
    }, 0);
}

export function update(file: File) {
    $('.inner', '#main-editor')[0].innerText = file.text;
    $('#tabbar').show();
    $('#main-editor').show();
    $('#editor-welcome').hide();
    updateMargin();
    updatePath(file);
}

export function updateMargin() {
    var lines = '';
    const editorText = $('.inner', '#main-editor')[0].innerText;
    const split = editorText.split('\n');
    for (var i=1; i<split.length; i++) {
        lines += i + '\n';
    }

    $('.margin', '#main-editor')[0].innerText = lines;
}

export function updatePath(file: File) {
    $('#navigationbar').children()[0].innerText = file.path;
    $('#navigationbar').show();
    $('#active-tab').children()[0].innerText = file.name;
}

export function write(_file: File) {
    const el = $('.inner', '#main-editor')[0];
    ipcRenderer.send('editorWriteReturn', el.innerText);
}

export function close(_file: File) {
    $('.inner', '#main-editor')[0].innerText = '';
    $('#navigationbar').children()[0].innerText = '';
    $('#active-tab').children()[0].innerText = '';

    $('#main-editor').hide();
    $('#tabbar').hide();
    $('#navigationbar').hide();
    $('#editor-welcome').show();
}