import { BrowserWindow, Menu, dialog } from 'electron';
import { File } from './files';
import Editor from './editor';
import * as path from 'path';

export default class Main {
    static isMac = process.platform === 'darwin';
    static mainWindow: Electron.BrowserWindow;
    static application: Electron.App;
    static BrowserWindow;

    private static onWindowAllClosed() {
        if (Main.isMac) {
            Main.application.quit();
        }
    }

    private static onClose() {
        Main.mainWindow = null
    }

    private static onReady() {
        Main.mainWindow = new Main.BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 320,
            minHeight: 240,
            titleBarStyle: 'hidden',
            vibrancy: 'window',
            backgroundColor: '#000000',
            webPreferences: {
                preload: path.join(__dirname, 'preload'),
                nodeIntegration: true,
                contextIsolation: true,
                hidden: true
            }
        });

        Main.mainWindow.hide();
        Main.mainWindow.loadURL('file://' + path.dirname(__dirname) + '/index.html');
        Main.mainWindow.on('closed', Main.onClose);
        Main.mainWindow.show();
    }

    private static showOpenDialog(): string[] {
        return dialog.showOpenDialogSync(Main.BrowserWindow, {
            properties: [
                'openFile', 'openDirectory', 'multiSelections'
            ]
        });
    }

    private static setupMenus() {
        const menuTemplate: Electron.MenuItemConstructorOptions[] = [
            // { role: 'appMenu' }
            Main.isMac ? {
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
            } : {},
            // { role: 'fileMenu' }
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Open',
                        type: 'normal',
                        accelerator: 'CommandOrControl+O',
                        click() {
                            Editor.open(Main.showOpenDialog());
                        }
                    },
                    {
                        label: 'Save',
                        type: 'normal',
                        accelerator: 'CommandOrControl+S',
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
                        accelerator: 'CommandOrControl+Shift+Esc',
                        click() {
                            if (Editor.file) {
                                Editor.close()
                            }
                        }
                    },
                    { role: 'quit' }
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
                    { role: 'pasteAndMatchStyle' },
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

        const menu = Menu.buildFromTemplate(menuTemplate)
        Menu.setApplicationMenu(menu)
    }

    static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.setupMenus();

        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    }
}