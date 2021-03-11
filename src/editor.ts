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

        ipcMain.on('editorClose', (_event, args) => {
            Editor.close(args);
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

    static close(file: File) {
        var files: File[] = [];
        Editor.files.forEach((currentFile, _i, _arr) => {
            if (currentFile.path != file.path) { files.push(currentFile); }
        });

        Editor.files = files;
        Main.mainWindow.webContents.send('main', new AppEvent('editorClose', file, Editor.files));
        const fileCount = Editor.files.length;
        if (file.path == Editor.openFile.path) {
            if (fileCount > 0) {
                Editor.openFile = Editor.files[fileCount - 1]
            } else {
                Editor.openFile = undefined;
            }
        }

        if (Editor.openFile) {
            console.log('Update');
            Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', Editor.openFile, Editor.files));
        } else {
            Main.mainWindow.webContents.send('main', new AppEvent('editorClose', Editor.openFile, Editor.files));
        }
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