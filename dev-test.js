var Finder = require('./');


var f = new Finder('/usr/share/icons/gnome');

// f.buildDirIndex(false, function (err, res) {
//     console.log('ok',err, res, f);
// });

f.findIcon('gedit', function (err, res) {
    console.log('ok', err, res);
});