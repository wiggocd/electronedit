import { ipcRenderer, remote } from 'electron';
import { AppEvent } from './events';
import { File } from './files';
import Main from './main';
import $ from 'jquery';

export var currentWindow: Electron.BrowserWindow;
const tab = '    ';
const tabLength = tab.length;

if (!Main.windowCreated) {
    addListeners();
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

function createTitlebar() {
    if (Main.isMac) {
        $('#titlebar').show();
        $('.editor').each((_index, el) => {
            el.style.height = 'calc(100% - var(--navbar-height) - var(--editor-padding) - var(--mac-titlebar-height) * 2)';
        });
    } else {
        require('./customtitlebar');
    }
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
    const sel = window.getSelection();

    // Todo: proess outdents and multiline tabbing

    if (sel.anchorNode != sel.focusNode || sel.anchorOffset != sel.focusOffset) {
        if (event.shiftKey) {
            
        } else {
            
        }
    } else if (event.shiftKey) {
        
    } else {
        document.execCommand('insertHTML', false, tab);
    }

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
    $('#main-editor')[0].innerText = file.text;
    $('#main-editor').show();
    $('#editor-welcome').hide();
    updateEditorPath(file);
}

function updateEditorPath(file: File) {
    $('#navigationbar').children()[0].innerText = file.path;
    $('#navigationbar').show();
}

function editorWrite(_file: File) {
    const el = $('#main-editor')[0];
    ipcRenderer.send('editorWriteReturn', el.innerText);
}

function closeEditor(_file: File) {
    $('#main-editor')[0].innerText = '';
    $('#navigationbar').children()[0].innerText = '';

    $('#main-editor').hide();
    $('#navigationbar').hide();
    $('#editor-welcome').show();
}