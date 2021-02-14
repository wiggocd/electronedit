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
    'Enter': insertNewline,
    'Tab': insertTab,
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

function insertNewline(): boolean {
    document.execCommand('insertHTML', false, '<br></br>');
    return false;
}

function insertTab(): boolean {
    document.execCommand('insertHTML', false, '    ');
    return false;
}

function processBackspace(): boolean {
    var sel = window.getSelection();
    var tabRange = new Range();
    tabRange.setStart(sel.anchorNode, sel.anchorOffset - tabLength);
    tabRange.setEnd(sel.anchorNode, sel.anchorOffset);

    var deleteTab = false;
    if (tabRange.toString() == tab) {
        deleteTab = true;
    }

    if (deleteTab) {
        sel.removeAllRanges();
        sel.addRange(tabRange);
        document.execCommand('delete', false);
        return false;
    } else {
        return true
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