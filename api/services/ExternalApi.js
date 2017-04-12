/**
 * Created by Parveen Arora on 24/02/15.
 * This Service is used to call other api
 */
var Promise = require('bluebird');
var request = Promise.promisify(require('request').defaults({
    pool: {
        maxSockets: Infinity
    }
}));

function requestWithRetry(options) {
    return request(options).then(function(response) {
        // sails.log.info("Miscellaneous Services Response", options, response[1]);
        return response;
    }).catch(function(e) {
        sails.log.error("Miscellaneous Service Response Error", options, e)
        options.retry = options.retry || 1;
        if (!options.noretry && options.retry < (sails.config.apiRetries || 3)) {
            options.retry++;
            return requestWithRetry(options);
        } else {
            throw e
        }
    })
}
module.exports = {
    request: requestWithRetry
}