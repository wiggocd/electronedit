import * as fs from 'fs';
import * as path from 'path';

export class File {
    path: string;
    basename: string;
    text: string;
    isOpen = false;

    constructor(path?: string) {
        this.path = path;
    }

    open() {
        if (this.path) {
            const text = fs.readFileSync(this.path, 'utf8');
            this.basename = path.basename(this.path);
            this.text = text;
            this.isOpen = true;
        }
    }

    write() {
        if (this.path && this.text != undefined) {
            fs.writeFile(this.path, this.text, (err) => {
                if (err) throw err;
                this.isOpen = true;
            });
        }
    }
}