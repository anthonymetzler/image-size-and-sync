import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron';

const ProgressBar = require('electron-progressbar');
const ipc = require('electron').ipcMain;

let iconImage = nativeImage.createFromPath(`${__dirname}/icon.png`);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let progressBar;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconImage
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  ipcMain.on('show-progressbar', (event, arg) => { showProgressbar(arg[0]); });
  ipcMain.on('process-progressbar', processingProgressBar);
  ipcMain.on('set-progressbar-completed', setProgressbarCompleted);
  ipcMain.on('show-error-dialog', (event, arg) => { showErrorDialog(arg[0], arg[1]); });

});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// listen to an open-dir-dialog command and sending back selected information
ipc.on('open-src-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }, (files) => {
    if (files) event.sender.send('select-source', files);
  });
});

ipc.on('open-output-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }, (files) => {
    if (files) event.sender.send('select-output', files);
  });
});

const showErrorDialog = (title, content) => {
  dialog.showErrorBox(title, content);
}

const showProgressbar = (maxValue) => {
  progressBar = new ProgressBar({
    indeterminate: false,
    maxValue,
    text: 'Processing Images...',
    detail: 'Wait...',
    browserWindow: {
      parent: mainWindow,
    },
  });

  progressBar.on('completed', () => {
    progressBar.detail = 'Image Processing Completed. Exiting...';
  });

  progressBar.on('progress', (value) => {
    progressBar.detail = `Processing ${value} out of ${progressBar.getOptions().maxValue} Images...`;
  });
};

const processingProgressBar = () => {
  if (!progressBar.isCompleted()) {
    progressBar.value += 1;
  }
};

const setProgressbarCompleted = () => {
  if (progressBar) {
    progressBar.setCompleted();
    progressBar.close();
  }
};
