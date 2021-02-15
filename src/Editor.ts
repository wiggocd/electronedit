import { AppEvent } from './events';
import { File } from './files'
import { ipcMain } from 'electron';
import Main from './main';
import * as path from 'path';

export default class Editor {
    static file = new File();

    static mainThreadInitialized() {
        ipcMain.on('editorWriteReturn', (_event, args) => {
            Editor.writeFile(args);
        });
    }

    static open(paths: string[]) {
        if (paths && paths.length > 0) {
            const first = paths[0];
            if (path.extname(first)) {
                Editor.file = new File(first);
                Editor.file.open();
                Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', Editor.file));
            }
        }
    }

    static save() {
        if (Editor.file) {
            Main.mainWindow.webContents.send('main', new AppEvent('editorWrite', Editor.file));
        }
    }

    static writeFile(text: string) {
        if (Editor.file) {
            Editor.file.text = text;
            Editor.file.isOpen = true;
            Editor.file.write();
            Main.mainWindow.webContents.send('main', new AppEvent('editorPathUpdate', Editor.file));
        }
    }

    static close() {
        Editor.file = undefined;
        Main.mainWindow.webContents.send('main', new AppEvent('editorClose', Editor.file));
    }

    static setPath(path: string) {
        if (path) {
            if (Editor.file) {
                Editor.file.path = path;
            } else {
                Editor.file = new File(path);
            }
        }
    }
}