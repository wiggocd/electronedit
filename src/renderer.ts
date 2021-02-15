import { ipcRenderer, remote } from 'electron';
import { AppEvent } from './events';
import { File } from './files';
import Main from './main';

var $: JQueryStatic;
var electronWindow: Electron.BrowserWindow;
const tab = '    ';
const tabLength = tab.length;
var documentCreated = false;

const ipcMethods = {
    'windowCreated': windowCreated,
    'editorUpdate': updateEditor,
    'editorPathUpdate': updateEditorPath,
    'editorWrite': editorWrite,
    'editorClose': closeEditor
};

const keyMethods = {
    'Enter': processNewline,
    'Tab': processTab,
    'Backspace': processBackspace
};

ipcRenderer.on('main', (_event, args) => {
    if (args) {
        const eventObject: AppEvent = args;
        if (ipcMethods[eventObject.eventName]) {
            ipcMethods[eventObject.eventName](eventObject.data);
        }
    }
});

document.addEventListener('readystatechange', () => {
    if (!documentCreated) {
        $ = require('jquery');
        addListeners();
        setStyles();
    }
    documentCreated = true;
});

function addListeners() {
    $('#mainEditor').on('keydown', (event) => {
        if (keyMethods[event.key]) {
            return keyMethods[event.key](event);
        }
    });
}

function setStyles() {
    if (!Main.isWindows) {
        $('#window-controls')[0].style.display = 'none';
    }
}

function windowCreated(_data: any) {
    electronWindow = remote.getCurrentWindow();
    handleWindowControls();
}

function handleWindowControls() {
    $('#min-button').on('click', (_event) => {
        electronWindow.minimize();
    });

    $('#max-button').on('click', (_event) => {
        electronWindow.maximize();
    });
    
    $('#restore-button').on('click', (_event) => {
        electronWindow.unmaximize();
    });

    $('#close-button').on('click', (_event) => {
        electronWindow.close();
    });

    toggleMaxRestoreButtons();
    electronWindow.on('maximize', toggleMaxRestoreButtons);
    electronWindow.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (electronWindow.isMaximized()) {
            document.body.classList.add('maximised');
        } else {
            document.body.classList.remove('maximised');
        }
    }
}

function processNewline(event: JQuery.KeyDownEvent): boolean {
    event.preventDefault();
    const el = document.getElementById('mainEditor');
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

    updateEditorPath(file);
}

function updateEditorPath(file: File) {
    var el = document.getElementById('navigationBar');
    el.innerText = file.path;
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
}