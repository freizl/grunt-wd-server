'use strict';

var grunt = require('grunt'),
    request = require('request')

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

exports.wd_server = {
    setUp: function(done) {
        this.seleniumURL = 'http://localhost:4444/wd/hub'
        done();
    },
    default_options: function(test) {
        request(this.seleniumURL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                test.ok(body.indexOf('WebDriver Hub') > 0)
                test.ok(true)
            } else {
                console.log(body)
                test.ok(false, 'shall selenium server be started')
            }

            test.done();
        })

    }
};
