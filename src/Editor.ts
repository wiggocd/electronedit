import * as path from 'path';
import * as fs from 'fs';

export default class Editor {
    static open(paths: string[]) {
        // Test with one file, incomplete
        if (paths.length > 0) {
            const first = paths[0];
            if (path.extname(first)) {
                fs.readFile(first, null, (err, data) => {
                    if (err) throw (err)
                    console.log(data);
                });
            }
        }
    }

    static save() {
        // Todo
    }
}
