import { ipcRenderer } from 'electron';
import { AppEvent } from './events';

ipcRenderer.on('main', (event, args) => {
    if (args) {
        const eventObject: AppEvent = args;
        switch (eventObject.eventName) {
            case 'editorUpdate':
                updateEditor(eventObject.data);
        }
    }
});

function updateEditor(text: string) {
    const el = document.getElementById('mainEditor');
    el.innerText = text;
}