var fs = require('fs');
var path = require('path');
var glob = require('glob');
var async = require('async');


var SCALABLE = 'scalable';
var EXTENSIONS = ['png', 'svg', 'xpm'];
var EXTENSIONS_PATTERN = '{' + EXTENSIONS.join(',') + '}';
var EXTENSIONS_PRIORITY = {
    'png': 2,
    'svg': 1,
    'xpm': 3
};
var EXTENSIONS_MAP_DOT = {
    '.png': true,
    '.svg': true,
    '.xpm': true
};


var Finder = module.exports = function Finder(root) {
    this.root = root;
    this.dirIndex = [];

    this.queue = async.queue(queueWorker.bind(this));

    this.queue.push({
        run:this.buildDirIndex.bind(this)
    }, function (err) {
        console.log('finished indexing');
    });
};


Finder.prototype.buildDirIndex = function(fn) {
    var self = this;

    var globopts = {
        cwd: this.root,
        nosort: true
    };
    async.waterfall([
        function(next) {
            console.time('glob');
            glob('**', globopts, next);
        },
        function(files, next) {
            console.timeEnd('glob');
            console.time('parse');
            var parsedFiles = [];
            var nameIndex = {};
            for (var i = files.length - 1; i >= 0; i--) {
                var fileStruct = parseFile(files[i]);
                if (fileStruct) {
                    parsedFiles.push(fileStruct);
                    var name    = fileStruct.name;
                    var size    = fileStruct.size;
                    var theme   = fileStruct.theme;
                    var context = fileStruct.context;
                    var ext     = fileStruct.ext;

                    if(!nameIndex[name]) {
                        nameIndex[name] = {};
                    }
                    if(!nameIndex[name][context]) {
                        nameIndex[name][context] = {};
                    }
                    if(!nameIndex[name][context][theme]) {
                        nameIndex[name][context][theme] = {};
                    }
                    if(!nameIndex[name][context][theme][size]) {
                        nameIndex[name][context][theme][size] = fileStruct;
                    } else {
                        if(EXTENSIONS_PRIORITY[ext] < EXTENSIONS_PRIORITY[nameIndex[name][context][theme][size].ext])
                        {
                            nameIndex[name][context][theme][size] = fileStruct;
                        }
                    }
                }
            }

            console.timeEnd('parse');
            // console.log(nameIndex);
            self.nameIndex = nameIndex;
            next(null);
        }
    ], fn);
};

Finder.prototype.findIcon = function(name, context, themes, fn) {
    this.queue.push({
        run : function (next) {
            next(null, this._findIconSync(name, context, themes));
        }.bind(this)
    }, fn);
};

Finder.prototype._findIconSync = function(name, context, themes) {
    var indexEntry = this.nameIndex[name];
    // console.log(indexEntry)
    if(!indexEntry) {
        return false;
    }
    indexEntry = indexEntry[context];
    if(!indexEntry) {
        return false;
    }

    for (var i = 0; i < themes.length; i++) {

        themeEntry = indexEntry[themes[i]];

        if(!themeEntry) {
            continue;
        }
        var sizes = Object.keys(themeEntry);
        sizes.sort(sizeComparator);

        return themeEntry[sizes[0]];
    }
    return false;


};


//---------------------

// function isDir(path, fn) {
//     fs.stat(path, function(err, stats) {
//         if (err) {
//             return fn(false);
//         }
//         fn(stats.isDirectory());
//     });
// }

function parseFile(file) {
    var ext = path.extname(file);
    if (!(ext in EXTENSIONS_MAP_DOT)) {
        return false; //not an icon file
    }
    var name = path.basename(file, ext);
    ext = ext.substr(1);
    var beforeName = path.dirname(file);
    var context = path.basename(beforeName);

    var beforeContext = path.dirname(beforeName);
    var sizeStr = path.basename(beforeContext);
    var size = getSize(sizeStr);

    if (!size) {
        return false;
    }

    var beforeSize = path.dirname(beforeContext);
    var theme = path.basename(beforeSize);


    return {
        theme: theme,
        context: context,
        sizeStr: sizeStr,
        size: size,
        name: name,
        ext: ext,
        orig: file
    };

}

function getSize(sizeStr) {
    if (sizeStr === 'scalable') {
        return SCALABLE;
    }
    var parts = sizeStr.match(/^(\d+)x(\d+)$/); //'22x22' -> ['22x22', '22', '22']
    if (!parts) {
        return false;
    }
    if (parts[1] !== parts[2]) {
        return false;
    }
    return +(parts[1]);
}

function sizeComparator(a, b) {
    // var a = x[1];
    // var b = y[1];

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

function queueWorker(task, next) {
    // var taskArgs = Array.prototype.slice.call(task.args);
    // taskArgs.push(next);
    task.run.call(this, next);
}
//TODO: debug only
module.exports.parseFile = parseFile;