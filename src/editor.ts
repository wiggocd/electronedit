import { AppEvent } from './events';
import { File } from './files'
import { ipcMain } from 'electron';
import Main from './main';
import * as path from 'path';

export default class Editor {
    static openFile = new File();
    static files: File[] = [];

    static mainThreadInitialized() {
        ipcMain.on('editorWriteReturn', (_event, args) => {
            Editor.writeFile(args);
        });

        ipcMain.on('editorUpdate', (_event, args) => {
            Editor.update(args);
        });
    }

    static open(paths: string[]) {
        if (paths && paths.length > 0) {
            const first = paths[0];
            if (path.extname(first)) {
                Editor.openFile = new File(first);
                Editor.openFile.open();
                Editor.files.push(Editor.openFile);
                Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', Editor.openFile, Editor.files));
            }
        }
    }

    static update(openFile: File) {
        Editor.openFile = openFile;
        Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', Editor.openFile, Editor.files));
    }

    static save() {
        if (Editor.openFile) {
            Main.mainWindow.webContents.send('main', new AppEvent('editorWrite', Editor.openFile));
        }
    }

    static writeFile(text: string) {
        if (Editor.openFile) {
            Editor.openFile = new File(Editor.openFile.path);
            Editor.openFile.text = text;
            Editor.openFile.isOpen = true;
            Editor.openFile.write();
            Main.mainWindow.webContents.send('main', new AppEvent('editorPathUpdate', Editor.openFile));
        }
    }

    static close() {
        var files: File[] = [];
        Editor.files.forEach((file, _i, _arr) => {
            if (file.path != Editor.openFile.path) { files.push(file); }
        });

        Editor.files = files;
        Main.mainWindow.webContents.send('main', new AppEvent('editorClose', Editor.openFile, Editor.files));
        const fileCount = Editor.files.length;
        if (fileCount > 0) {
            Editor.openFile = Editor.files[fileCount - 1]
        } else {
            Editor.openFile = undefined;
        }

        Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', Editor.openFile, Editor.files));
    }

    static setPath(path: string) {
        if (path) {
            if (Editor.openFile) {
                Editor.openFile.path = path;
            } else {
                Editor.openFile = new File(path);
            }
        }
    }

    static newFile(path: string) {
        if (path) {
            Editor.setPath(path);
            Editor.openFile.isOpen = true;
            Editor.openFile.text = '';
            Editor.files.push(Editor.openFile);
            Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', Editor.openFile));
        }
    }
}