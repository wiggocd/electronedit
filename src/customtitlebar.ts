import { Titlebar, Color } from 'custom-electron-titlebar';
import * as Renderer from "./renderer";

const iconRelativeToRoot = 'resources/icon.png';

createTitlebar();

function createTitlebar() {
    new Titlebar({
        backgroundColor: Color.fromHex('#2e2e2e'),
        icon: iconRelativeToRoot,
        overflow: 'hidden'
    });

    $('.window-icon.window-close')[0].addEventListener('click', (_event) => {
        console.log('Close');
        Renderer.currentWindow.close();
    });
}