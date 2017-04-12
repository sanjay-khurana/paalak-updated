'use strict';

var _ = require('lodash');
var path = require('path');
 var fs = require('fs');

var BaseController = function() {};

// Add default behaviours to the controllers
BaseController.prototype.index = function(req, res) {
    res.ok();
};

BaseController.createResponse = function(data) {
    console.log("Inside Base Controller", data);
    return true;
}

BaseController.extend = function(object) {
    return _.extend({}, BaseController.prototype, object);
};

BaseController.logInfo = function(filename, data) {
	if (filename && data) {
            var data = typeof data === 'string' ? data : JSON.stringify(data);
            var date = new Date();
            var fileFrequency = {
                daily : '-' + date.getDate() + '-' + (Number(date.getMonth()) + 1 ) + '-' + date.getFullYear() + '.log',
                hourly : '-' + date.getDate() + '-' + (Number(date.getMonth()) + 1 ) + '-' + date.getFullYear() + '-' + date.getHours() + '.log',
                none : '.log'
             };
             var frequency = frequency ? fileFrequency[frequency] : fileFrequency['none'];
             var logPaalak = "/var/log/";
             var filename = path.join(logPaalak, 'paalak', filename + frequency);
             fs.appendFile(filename, data + '\n', function (err) {
                 if (err) {
                     console.log(err);
                 }
             });
         }
}

module.exports = BaseController;