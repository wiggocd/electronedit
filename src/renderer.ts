import { ipcRenderer, remote } from 'electron';
import { AppEvent } from './events';
import Main from './main';
import * as EditorProcesses from './editorprocesses';
import $ from 'jquery';

export var currentWindow: Electron.BrowserWindow;

if (!Main.windowCreated) {
    addListeners();
    createTitlebar();
}

const ipcMethods = {
    'windowCreated': windowCreated,
    'editorUpdate': EditorProcesses.update,
    'editorPathUpdate': EditorProcesses.updatePath,
    'editorWrite': EditorProcesses.write,
    'editorClose': EditorProcesses.close,
    'undo': EditorProcesses.undo,
    'redo': EditorProcesses.redo
};

const keyMethods = {
    'Enter': EditorProcesses.processNewline,
    'Tab': EditorProcesses.processTab,
    'Backspace': EditorProcesses.processBackspace
};

ipcRenderer.on('main', (_event, args) => {
    if (args) {
        const eventObject: AppEvent = args;
        if (ipcMethods[eventObject.eventName]) {
            ipcMethods[eventObject.eventName](...eventObject.data);
        }
    }
});

function addListeners() {
    $('#main-editor').on('keydown', (event) => {
        var ret = true;
        if (keyMethods[event.key]) {
            ret = keyMethods[event.key](event);
        } else if (event.metaKey && event.key == 'z') {
            EditorProcesses.updateWithTimeout();
        }

        EditorProcesses.updateMargin();
        return ret;
    });

    $('#main-editor').on('cut paste', (_event) => {
        EditorProcesses.updateWithTimeout();
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