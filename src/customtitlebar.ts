import { Titlebar, Color } from 'custom-electron-titlebar';
import { remote } from 'electron';
import $ from 'jquery';

const iconRelativeToRoot = 'resources/icon.png';

createTitlebar();

function createTitlebar() {
    const titlebar = new Titlebar({
        backgroundColor: Color.fromHex('#2e2e2e'),
        icon: iconRelativeToRoot,
        overflow: 'hidden'
    });

    const originalTitle = document.title;
    document.title = '';
    titlebar.updateTitle();
    document.title = originalTitle;

    const closeButton = $('.window-close')[0];
    closeButton.addEventListener('click', (_event) => {
        remote.getCurrentWindow().hide();
    });
}