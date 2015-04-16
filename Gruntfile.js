/**
 * Created by askmebefore on 30.11.14.
 */
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        node_modules_path: 'node_modules',
        vendor_path: 'frontend/vendor',
        custom_css_path: 'frontend/css',
        app_path: 'frontend/app',

        js_path: 'static/js',
        css_path: 'static/css',
        fonts_path: 'static/fonts',

        copy: {
            main: {
                files:[
                    {
                        expand: true,
                        cwd: '<%= vendor_path %>/bootstrap/dist/fonts/',
                        src: ['**'],
                        dest: '<%= fonts_path %>/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: '<%= vendor_path %>/bootstrap/dist/css/',
                        src: ['**'],
                        dest: '<%= css_path %>/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: '<%= node_modules_path %>/highlight.js/styles/',
                        src: ['**'],
                        dest: '<%= css_path %>/code_highlight/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: '<%= custom_css_path %>/',
                        src: ['**'],
                        dest: '<%= css_path %>/',
                        filter: 'isFile'
                    }
                ]
            }
        },
        concat: {
            options: {
                separator: '\n'
            },
            libs: {
                src: [
                    '<%= vendor_path %>/jquery/dist/jquery.js',
                    '<%= vendor_path %>/bootstrap/dist/js/bootstrap.js',
                    '<%= vendor_path %>/bootstrap-file-input/bootstrap-file-input.js',
                    '<%= vendor_path %>/angular/angular.js',
                    '<%= vendor_path %>/underscore/underscore.js'
                ],
                dest: '<%= js_path %>/libs.js'
            },
            app: {
                src:[
                    '<%= app_path %>/app.js',
                    '<%= app_path %>/controllers/datasetController.js'
                ],
                dest: '<%= js_path %>/app.js'
            }
        }

    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('compile', ['copy', 'concat']);
};
