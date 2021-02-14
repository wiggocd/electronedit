import { ipcRenderer } from 'electron';
import { AppEvent } from './events';
import { File } from './files';

var documentCreated = false;
const tab = '    ';
const tabLength = tab.length;

const ipcMethods = {
    'editorUpdate': updateEditor,
    'editorWrite': editorWrite,
    'editorClose': closeEditor
};

const keyMethods = {
    'Enter': processNewline,
    'Tab': processTab,
    'Backspace': processBackspace
};

ipcRenderer.on('main', (event, args) => {
    if (args) {
        const eventObject: AppEvent = args;
        if (ipcMethods[eventObject.eventName]) {
            ipcMethods[eventObject.eventName](eventObject.data);
        }
    }
});

document.addEventListener('readystatechange', () => {
    if (!documentCreated) {
        addListeners();
    }
});

function addListeners() {
    const $: JQueryStatic = require('jquery');

    $('#mainEditor').on('keydown', (event) => {
        if (keyMethods[event.key]) {
            return keyMethods[event.key](event);
        }
    });

    documentCreated = true;
}

function getCaretIndex(el: HTMLElement): number {
    var position = 0;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
        const sel = window.getSelection();
        if (sel.rangeCount != 0) {
            const range = sel.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(el);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            position = preCaretRange.toString().length;
        }
    }

    return position;
}

function getLineAtCaretInElement(el: HTMLElement): string {
    const sel = window.getSelection();
    const caretIndex = getCaretIndex(el);

    const splitLines = el.innerText.substr(caretIndex - sel.anchorOffset, el.innerText.length).split('\n');
    const lineData = splitLines ? splitLines[0] : '';
    
    return lineData;
}

function processNewline(event: JQuery.KeyDownEvent): boolean {
    event.preventDefault();
    const el = document.getElementById('mainEditor');
    const lineData = getLineAtCaretInElement(el);

    var spaceCount = 0;
    for (var i=0; i<lineData.length; i++) {
        if (lineData[i] == ' ') { spaceCount++; } else break;
    }

    const tabCount = Math.floor(spaceCount / tabLength);
    const insertTab = tabCount > 0;
    if (insertTab) {
        for (var i=0; i<tabCount; i++) { document.execCommand('insertLineBreak'); }
        document.execCommand('insertHTML', false, tab);
    } else {
        document.execCommand('insertLineBreak');
    }

    return false;
}

function processTab(event: JQuery.KeyDownEvent): boolean {
    event.preventDefault();
    document.execCommand('insertHTML', false, tab);
    return false;
}

function processBackspace(_event: JQuery.KeyDownEvent): boolean {
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

function updateEditor(file: File) {
    var el = document.getElementById('mainEditor');
    el.innerText = file.text;

    el = document.getElementById('navigationBar');
    el.innerText = file.path;
    el.hidden = false;
}

function editorWrite(_file: File) {
    const el = document.getElementById('mainEditor');
    ipcRenderer.send('editorWriteReturn', el.innerText);
}

function closeEditor(_file: File) {
    var el = document.getElementById('mainEditor');
    el.innerText = '';

    el = document.getElementById('navigationBar');
    el.innerText = '';
    el.hidden = true;
}