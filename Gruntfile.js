/**
 * http://gruntjs.com/configuring-tasks
 */
module.exports = function (grunt) {
    var path = require('path');
    var ZERO_DOC_DIST_PATH = 'docs/dist';
    var ZERO_DOC_SRC_PATH = 'docs/src';
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            zero: {
                src: ZERO_DOC_DIST_PATH
            }
        },

        jsdoc: {
            zero: {
                src: [
                     './system/**/*.js',

                    // You can add README.md file for index page at documentations.
                    'README.md'
                ],
                options: {
                    verbose: true,
                    destination: ZERO_DOC_DIST_PATH,
                    configure: ZERO_DOC_SRC_PATH+'/conf.json',
                    template: ZERO_DOC_SRC_PATH,
                    'private': false
                }
            }
        },

        less: {
            dist: {
                src: ZERO_DOC_SRC_PATH+'/less/**/jaguar.less',
                dest: ZERO_DOC_SRC_PATH+'/static/styles/jaguar.css'
            }
        },

        copy: {
            css: {
                src: ZERO_DOC_SRC_PATH+'/static/styles/jaguar.css',
                dest: ZERO_DOC_DIST_PATH + '/styles/jaguar.css'
            },

            js: {
                src: ZERO_DOC_SRC_PATH+'/static/scripts/main.js',
                dest: ZERO_DOC_DIST_PATH + '/scripts/main.js'
            }
        }
    });

    // Load task libraries
    [
        'grunt-contrib-clean',
        'grunt-contrib-less',
        'grunt-jsdoc'
    ].forEach(function (taskName) {
        grunt.loadNpmTasks(taskName);
    });

    grunt.registerTask('doc', 'Create documentations for zero', [
        'less',
        'clean:zero',
        'jsdoc:zero'
    ]);
};
