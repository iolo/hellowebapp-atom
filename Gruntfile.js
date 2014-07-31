module.exports = function (grunt) {
    'use strict';

    var path = require('path');

    var srcDir = path.resolve('src');
    var buildDir = path.resolve('build');

    var atomCmd = path.join(buildDir, (process.platform == 'darwin') ? 'Atom.app/Contents/MacOS/Atom' : 'atom-shell/atom');
    var atomAppDir = path.join(buildDir, (process.platform == 'darwin') ? 'Atom.app/Contents/Resources' : 'atom-shell/resources', 'app');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        srcDir: srcDir,
        buildDir: buildDir,
        atomCmd: atomCmd,
        atomAppDir: atomAppDir,
        jshint: {
            options: {
                devel: true,
                node: true,
                '-W030': true,//Expected an assignment or function call and instead saw an expression.
                '-W097': true,//Use the function form of 'use strict'.
                globals: {
                }
            },
            app: ['<%=srcDir%>/js/**/*.js']
        },
        nodeunit: {
            all: ['tests/**/*_test.js']
        },
        qunit: {
            all: ['tests/**/*_test.html']
        },
        concat: {
            options: {
                separator: ';'
            },
            app: {
                src: ['<%=srcDir%>/js/**/*.js'],
                dest: '<%=atomAppDir%>/js/all.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%=pkg.name%> <%=pkg.version%> (build at ' + (new Date()) + ') */\n'
            },
            app: {
                files: {
                    '<%=atomAppDir%>/js/all.min.js': ['<%=concat.app.dest%>']
                }
            }
        },
        jade: {
            options: {
                pretty: false, // https://github.com/visionmedia/jade/issues/889
                compileDebug: true
            },
            app: {
                expand: true,
                cwd: srcDir,
                src: ['**/*.jade'],
                dest: atomAppDir,
                ext: '.html'
            }
        },
        less: {
            options: {
                cleancss: true
            },
            app: {
                expand: true,
                cwd: srcDir,
                src: ['**/*.less'],
                dest: atomAppDir,
                ext: '.css'
            }
        },
        coffee: {
            options: {
            },
            app: {
                expand: true,
                cwd: srcDir,
                src: ['**/*.coffee'],
                dest: atomAppDir,
                ext: '.js'
            }
        },
        copy: {
            app: {
                expand: true,
                cwd: srcDir,
                src: ['**', '!**/*.jade', '!**/*.less', '!**/*.coffee'],
                dest: atomAppDir
            }
        },
        watch: {
            options: {nospawn: true},
            app: {
                files: ['<%=srcDir%>/**/*', '!**/*.jade', '!**/*.less', '!**/*.coffee'],
                tasks: ['copy:app']
            },
            jade: {
                files: ['<%=srcDir%>/**/*.jade'],
                tasks: ['jade:app']
            },
            less: {
                files: ['<%=srcDir%>/**/*.less'],
                tasks: ['less:app']
            },
            coffee: {
                files: ['<%=srcDir%>/**/*.coffee'],
                tasks: ['coffee:app']
            }
        },
        clean: {
            build: atomAppDir
        },
        'download-atom-shell': {
            version: '0.15.0',
            outputDir: buildDir
        }/*,
        'build-atom-shell-app': {
         options: {
         platforms: ['darwin', 'win32', 'linux']
         }
         }*/
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    //grunt.loadNpmTasks('grunt-contrib-nodeunit');
    //grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.loadNpmTasks('grunt-download-atom-shell');
    grunt.loadNpmTasks('grunt-atom-shell-app-builder');

    grunt.registerTask('atom:run', function () {
        grunt.util.spawn({ cmd: atomCmd });
    });

    grunt.registerTask('atom:package', function () {
        if (process.platform == 'darwin') {
            grunt.util.spawn({ cmd: 'scripts/make-dmg.sh' });
        } else {
            // TODO: support built window msi/linux zip package...
            grunt.log.error('unsupported platform: ' + process.platform);
        }
    });

    grunt.registerTask('default', ['build']);
    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('build', ['jshint', 'concat', 'uglify', 'jade', 'less', 'coffee', 'copy']);
    grunt.registerTask('run', ['build', 'atom:run', 'watch']);

    grunt.event.on('watch', function (action, filepath, target) {
        if (grunt.file.isMatch(grunt.config('watch.app.files'), filepath)) {
            var src = filepath.replace(grunt.config('copy.app.cwd'), '');
            grunt.config('copy.app.src', [src]);
        }
        if (grunt.file.isMatch(grunt.config('watch.jade.files'), filepath)) {
            var src = filepath.replace(grunt.config('jade.app.cwd'), '');
            grunt.config('jade.app.src', [src]);
        }
    });
};
