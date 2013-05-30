var Finder = require('./');


var f = new Finder('/usr/share/icons');

f.findIcon('accessories-text-editor', 'apps', ['gnome', 'hicolor'], function (err, res) {
    console.log('ok', err, res);
});

f.findIcon('terminator', 'apps', ['gnome', 'hicolor'], function (err, res) {
    console.log('ok', err, res);
});

f.findIcon('iceweasel', 'apps', ['gnome', 'hicolor'], function (err, res) {
    console.log('ok', err, res);
});

f.findIcon('google-chrome', 'apps', ['gnome', 'hicolor'], function (err, res) {
    console.log('ok', err, res);
});
