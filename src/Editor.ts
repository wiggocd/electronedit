import * as path from 'path';
import * as fs from 'fs';
import { AppEvent } from './events';
import Main from './main';

export default class Editor {
    static open(paths: string[]) {
        // Test with one file, incomplete
        if (paths.length > 0) {
            const first = paths[0];
            if (path.extname(first)) {
                fs.readFile(first, 'utf8', (err, data) => {
                    if (err) throw (err)
                    Main.mainWindow.webContents.send('main', new AppEvent('editorUpdate', data.toString()));
                });
            }
        }
    }

    static save() {
        // Todo
    }
}