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
    if (sel.anchorNode != sel.focusNode) {
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

function tabMultiline(outdent: boolean) {
    const sel = window.getSelection();
    const el = sel.anchorNode.parentElement;
    var pastAnchorNode = false;
    var pastFocusNode = false;
    var firstNode: Node;
    for (var i=0; i< el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (!pastAnchorNode && !firstNode && node == sel.anchorNode) {
            firstNode = sel.anchorNode;
        }
        
        if (!pastFocusNode && !firstNode && node == sel.focusNode) {
            firstNode = sel.focusNode;
        }

        if (firstNode) {
            if ((firstNode == sel.anchorNode && !pastFocusNode)
            || (firstNode == sel.focusNode && !pastAnchorNode)) {
                if (outdent) {
                    node.textContent = node.textContent.substr(tabLength, node.textContent.length);
                } else {
                    node.textContent = tab + node.textContent;
                }
            } else {
                break;
            }
        }

        if (!pastAnchorNode && node == sel.anchorNode) {
            pastAnchorNode = true;
        }
        
        if (!pastFocusNode && node == sel.focusNode) {
            pastFocusNode = true;
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

export function update(file: File) {
    $('.inner', '#main-editor')[0].innerText = file.text;
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