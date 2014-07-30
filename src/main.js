var app = require('app');
var BrowserWindow = require('browser-window');

require('crash-reporter').start();

var win;
app.on('window-all-closed', function () {
    console.log('window-all-closed!');
    if (process.platform != 'darwin') {
        app.quit();
    }
});
app.on('ready', function () {
    win = new BrowserWindow({width: 800, height: 480});
    win.loadUrl('file://' + __dirname + '/index.html');
    win.on('closed', function () {
        console.log('closed!');
        win = null;
    });
});


