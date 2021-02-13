import * as fs from 'fs';

export class File {
    path: string;
    text: string;
    isOpen = false;

    constructor(path?: string) {
        this.path = path;
    }

    open() {
        if (this.path) {
            const text = fs.readFileSync(this.path, 'utf8');
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