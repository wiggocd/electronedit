import { ipcRenderer } from 'electron';
import { AppEvent } from './events';
import * as fs from 'fs';

ipcRenderer.on('main', (event, args) => {
    if (args) {
        const eventObject: AppEvent = args;
        switch (eventObject.eventName) {
            case 'editorUpdate':
                updateEditor(eventObject.data);
            case 'editorWrite':
                editorWriteToPath(eventObject.data);
        }
    }
});

function updateEditor(text: string) {
    const el = document.getElementById('mainEditor');
    el.innerText = text;
}

function editorWriteToPath(path: string) {
    const el = document.getElementById('mainEditor');
    fs.writeFile(path, el.innerText, (err) => {
        if (err) throw (err);
    });
}