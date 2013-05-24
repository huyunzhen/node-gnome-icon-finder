var fs = require('fs');
var path = require('path');
var async = require('async');


var SCALABLE = 'scalable';
var EXTENSIONS = ['ico', 'svg', 'png'];


var Finder = module.exports = function Finder(root) {
    this.root = root;
    this.dirIndex = [];
};


Finder.prototype.buildDirIndex = function(force, fn) {
    var self = this;
    if (force) {
        self.dirIndex = [];
    }
    if (self.dirIndex.length) {
        fn(null);
        return;
    }

    async.waterfall([
        function(next) {
            fs.readdir(self.root, next);
        },

        function(files, next) {
            next(null, files.map(function(item) {
                return self.root + '/' + item;
            }));
        },

        function(files, next) {
            async.filter(files, isDir, function(res) {
                next(null, res);
            });
        },

        function(dirs, next) {

            self.dirIndex = dirs.map(function(item) {
                return [item, getSize(item)];
            }).filter(function(item) {
                return false !== item[1];
            }).sort(sizeComparator);

            next();
        }
    ], fn);
};

Finder.prototype.findIcon = function(name, fn) {
    var self = this;

    async.waterfall([
        function(next) {
            self.buildDirIndex(false, next);
        },
        function(next) {
            async.detectSeries(
                self.dirIndex,
                self.findIconInDir.bind(self, name), function(icon) {
                next(null, icon);
            });
        }
    ], fn);
};
Finder.prototype.findIconInDir = function(name, indexItem, fn) {
    var dir = indexItem[0];
    var size = indexItem[1];
    fn(1);
};

//---------------------

function isDir(path, fn) {
    fs.stat(path, function(err, stats) {
        if (err) {
            return fn(false);
        }
        fn(stats.isDirectory());
    });
}

function getSize(dir) {
    var d = path.basename(dir);
    if (d === 'scalable') {
        return SCALABLE;
    }
    var parts = d.match(/^(\d+)x(\d+)$/); //'22x22' -> ['22x22', '22', '22']
    if (!parts) {
        return false;
    }
    if (parts[1] !== parts[2]) {
        return false;
    }
    return +(parts[1]);
}

function sizeComparator(x, y) {
    var a = x[1];
    var b = y[1];

    if (SCALABLE === a) {
        a = 100000;
    }
    if (SCALABLE === b) {
        b = 100000;
    }

    return b - a;
}

function fileMatch(file, name) {
    return name === path.basename(file, EXTENSIONS);
}