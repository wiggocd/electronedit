import { BrowserWindow, Menu, dialog } from 'electron';
import { AppEvent } from './events';
import Editor from './editor';
import * as path from 'path';

var appMenu: Electron.MenuItemConstructorOptions;

export default class Main {
    static isMac = process.platform === 'darwin';
    static isWindows = process.platform == 'win32';
    static mainWindow: Electron.BrowserWindow;
    static application: Electron.App;
    static BrowserWindow;
    static windowCreated = false;

    static windowParams: any = {
        width: 800,
        height: 600,
        minWidth: 320,
        minHeight: 240,
        vibrancy: 'window',
        backgroundColor: '#000000',
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: true,
            hidden: true
        }
    }

    private static onWindowAllClosed() {
        if (Main.isMac) {
            Main.application.quit();
        }
    }

    private static onClose() {
        Main.mainWindow = null;
        Main.windowCreated = false;
    }

    private static onReady() {
        Main.mainWindow = new Main.BrowserWindow(Main.windowParams);

        Main.mainWindow.hide();
        Main.mainWindow.loadURL('file://' + path.dirname(__dirname) + '/index.html');
        Main.mainWindow.on('closed', Main.onClose);
        Main.mainWindow.on('ready-to-show', Main.onWindowReadyToShow);
        Main.mainWindow.show();

        Editor.mainThreadInitialized();
    }

    private static onWindowReadyToShow() {
        if (!Main.windowCreated) {
            Main.mainWindow.webContents.send('main', new AppEvent('windowCreated'));
            Main.windowCreated = true;
        }
    }

    private static setupMenus() {
        var finalMenuTemplate: Electron.MenuItemConstructorOptions[] = [];
        if (Main.isMac) {
            appMenu = (
                // { role: 'appMenu' }
                {
                    label: Main.application.name,
                    submenu: [
                        { role: 'about' },
                        { type: 'separator' },
                        { role: 'services' },
                        { type: 'separator' },
                        { role: 'hide' },
                        { role: 'hideOthers' },
                        { role: 'unhide' },
                        { type: 'separator' },
                        { role: 'quit' }
                    ]
                }
            );
            finalMenuTemplate.push(appMenu);
        }

        menuTemplate.forEach((value) => {
            finalMenuTemplate.push(value);
        });

        const menu = Menu.buildFromTemplate(finalMenuTemplate);
        Menu.setApplicationMenu(menu);
    }

    static showOpenDialog(): string[] {
        return dialog.showOpenDialogSync(Main.BrowserWindow, {
            properties: [
                'openFile', 'openDirectory', 'multiSelections'
            ]
        });
    }

    static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.setupMenus();

        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    }
}

const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: 'New File',
                type: 'normal',
                accelerator: 'CmdOrCtrl+N',
                click() {
                    if (!Editor.file.path) {
                        Editor.newFile(dialog.showSaveDialogSync(Main.mainWindow));
                    }
                }
            },
            {
                label: 'Open',
                type: 'normal',
                accelerator: 'CmdOrCtrl+O',
                click() {
                    Editor.open(Main.showOpenDialog());
                }
            },
            {
                label: 'Save',
                type: 'normal',
                accelerator: 'CmdOrCtrl+S',
                click() {
                    if (!Editor.file.path) {
                        Editor.setPath(dialog.showSaveDialogSync(Main.mainWindow));
                    }
                    Editor.save();
                }
            },
            {
                label: 'Close',
                type: 'normal',
                accelerator: 'CmdOrCtrl+W',
                click() {
                    if (Editor.file) {
                        Editor.close()
                    }
                }
            },
            {
                role: 'quit',
                accelerator: 'CmdOrCtrl+Q'
            }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: Main.isMac ? [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
        ] : [
            {
                label: 'Paste',
                role: 'pasteAndMatchStyle',
                accelerator: 'CmdOrCtrl+V'
            },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
                label: 'Speech',
                submenu: [
                    { role: 'startSpeaking' },
                    { role: 'stopSpeaking' }
                ]
            }
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: Main.isMac ? [
            { role: 'minimize' },
            { role: 'zoom' },
            { role: 'close' }
        ] : [
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            }
        ]
    }
]