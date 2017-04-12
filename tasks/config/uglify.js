/**
 * `uglify`
 *
 * ---------------------------------------------------------------
 *
 * Minify client-side JavaScript files using UglifyJS.
 *
 * For usage docs see:
 *   https://github.com/gruntjs/grunt-contrib-uglify
 *
 */
module.exports = function(grunt) {

  grunt.config.set('uglify', {
    dist: {
      src: ['./assets/js/catalog.js'],
      dest: './assets/min/catalog.min.js'
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
};
