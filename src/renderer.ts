import { ipcRenderer } from 'electron';
import { createNoSubstitutionTemplateLiteral, TupleType } from 'typescript';
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
    const tab = '&emsp;';

    $('#mainEditor').on('keydown', (event) => {
        if (keyMethods[event.key]) {
            return keyMethods[event.key]();
        }
    });

    documentCreated = true;
}

function getCaretLine(el: HTMLElement): number {
    const sel = window.getSelection();
    console.log(sel);
    return 0;
}

function processNewline(): boolean {
    const el = document.getElementById('mainEditor');
    const lineNumber = getCaretLine(el);
    console.log(lineNumber);

    const splitByNewline = el.innerText.split('\n\n');
    const lineData = splitByNewline[lineNumber];
    const lineLength = lineData.length;

    var spaceCount = 0;
    for (var i=0; i<lineLength; i++) {
        if (lineData[i] == ' ') { spaceCount++; } else break;
    }

    const tabCount = spaceCount / tabLength;
    const insertTab = tabCount > 0;
    if (insertTab) {
        for (var i=0; i<tabCount; i++) { document.execCommand('insertLineBreak'); }
        document.execCommand('insertHTML', false, tab);
    } else {
        document.execCommand('insertLineBreak');
    }

    return false;
}

function processTab(): boolean {
    document.execCommand('insertHTML', false, tab);
    return false;
}

function processBackspace(): boolean {
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