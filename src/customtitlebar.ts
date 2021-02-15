import { Titlebar, Color } from 'custom-electron-titlebar';

const iconRelativeToRoot = 'resources/icon.png';

createTitlebar();

function createTitlebar() {
    new Titlebar({
        backgroundColor: Color.fromHex('#2e2e2e'),
        icon: iconRelativeToRoot,
        overflow: 'hidden'
    });
}