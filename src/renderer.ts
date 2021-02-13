import { ipcRenderer } from 'electron';
import { AppEvent } from './events';
import { File } from './files';
import * as text from './text';

var documentCreated = false;

const ipcMethods = {
    'editorUpdate': updateEditor,
    'editorWrite': editorWrite,
    'editorClose': closeEditor
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
    const mainEditor = document.getElementById('mainEditor');
    const tab = '&emsp;';

    $('#mainEditor').on('keydown', (event) => {
        if (event.key == 'Enter') {
            document.execCommand('insertHTML', false, '<br></br>');
            return false;
        } else if (event.key == 'Tab') {
            document.execCommand('insertHTML', false, tab);
            return false;
        }
    });

    documentCreated = true;
}

function updateEditor(file: File) {
    var el = document.getElementById('mainEditor');
    el.innerText = file.text;
    el.innerHTML = text.formatText(el.innerHTML);

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