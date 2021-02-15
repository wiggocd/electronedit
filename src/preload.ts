import * as Electron from 'electron';

document.addEventListener('readystatechange', (_event) => {
    if (Electron.remote) {
        require('./renderer');
    }
});