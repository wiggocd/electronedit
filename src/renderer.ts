import { ipcRenderer, remote } from 'electron';
import { AppEvent } from './events';
import { File } from './files';
import { Titlebar, Color } from 'custom-electron-titlebar';
import Main from './main';
import $ from 'jquery';

var currentWindow: Electron.BrowserWindow;
const tab = '    ';
const tabLength = tab.length;
const iconRelativeToRoot = 'resources/icon.png';

if (!Main.windowCreated) {
    addListeners();
    setStyles();
    createTitlebar();
}

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

function addListeners() {
    $('#main-editor').on('keydown', (event) => {
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

function createTitlebar() {
    new Titlebar({
        backgroundColor: Color.fromHex('#2e2e2e'),
        icon: iconRelativeToRoot,
        overflow: 'hidden'
    });

    $('.window-icon.window-close')[0].addEventListener('click', (_event) => {
        console.log('Close');
        currentWindow.close();
    });
}

function windowCreated(_data: any) {
    currentWindow = remote.getCurrentWindow();
}

function processNewline(event: JQuery.KeyDownEvent): boolean {
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
    var el = document.getElementById('main-editor');
    el.innerText = file.text;

    updateEditorPath(file);
}

function updateEditorPath(file: File) {
    $('#navigationbar').children()[0].innerText = file.path;
}

function editorWrite(_file: File) {
    const el = document.getElementById('main-editor');
    ipcRenderer.send('editorWriteReturn', el.innerText);
}

function closeEditor(_file: File) {
    var el = document.getElementById('main-editor');
    el.innerText = '';

    $('#navigationbar').children()[0].innerText = '';
}