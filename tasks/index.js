/*
 * grunt-wd-server
 * https://github.com/beanstock/grunt-wd-server
 *
 * Copyright (c) 2015 Haisheng.Wu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var fs = require('fs'),
        os = require('os'),
        path = require('path'),
        url = require('url'),
        format = require('string-format'),
        when = require('when'),
        deepExtend = require('deep-extend'),
        child_process = require('child_process'),
        spawn = require('child_process').spawn,
        exec = require('child_process').exec,
        request = require('request'),
        ProgressBar = require('progress'),
        processes = {}

    format.extend(String.prototype)

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('start_wd_server', 'grunt webdriver selenium server', function() {

        var defaults = {
            selenium: {
                version: '2.44',
                minVersion: '0',
                serverOptions: {},
                systemProperties: {}
            },
            chrome: {
                version: '2.14'
            },
            ie: {
                version: '2.44',
                minVersion: '0'
            },
            urlMapping: {
                selenium: 'http://selenium-release.storage.googleapis.com/{version}/selenium-server-standalone-{version}.{minVersion}.jar',
                chrome: 'http://chromedriver.storage.googleapis.com/{version}/chromedriver_{platform}.zip',
                ie: 'http://selenium-release.storage.googleapis.com/{version}/IEDriverServer_{platform}_{version}.{minVersion}.zip'
            },
            downloadLocation: os.tmpdir()
        },
            userOpt = this.options(),
            options = deepExtend({}, defaults, userOpt)

        grunt.verbose.writeln('platform:' + os.platform()  + ', ' + os.arch())
        grunt.verbose.writeln('dirname:' + __dirname)
        grunt.verbose.writeln('options:' + JSON.stringify(options, null, 2))

        var done = this.async(),
            target = this.target,
            end = function () {
                done(true)
            },
            errorHandler = function (error) {
                grunt.log.error(error)
                done(false)
            },
            applyOptions = function (fn) { return fn(options) },
            genOpt = function (url) {
                return { url: url,
                         destination: path.join(options.downloadLocation, path.basename(url))
                       }
            },
            urls = [seleniumDL, chromeDL, ieDL].map(applyOptions),
            opts = urls.filter(isNotEmpty).map(genOpt),
            startSelenium = function () {
                var opt = options.selenium
                opt.target = target
                opt.destination = opts[0].destination
                opt.downloadLocation = options.downloadLocation
                return when.lift(ss)(opt)
            }

        grunt.verbose.writeln('urls:' + urls)
        grunt.verbose.writeln('download dest:' + options.downloadLocation)

        // make download dir if not exists
        if (!fs.existsSync(options.downloadLocation)) {
            grunt.verbose.writeln('making dir: ' + options.downloadLocation)
            fs.mkdirSync(options.downloadLocation)
        }

        when.all(opts.map(ff))
            .then(startSelenium)
            .catch(errorHandler)
            .then(end)

    })

    grunt.registerMultiTask('stop_wd_server', 'Stop Selenium server.', function () {
        var target = this.target,
            done = this.async

        // Make sure we have a reference to the running server process.
        if (!processes[target]) {
            grunt.log.error('Server not running.');
        } else {
            grunt.log.ok('Sending kill signal to child process ' + processes[target].pid);
            processes[target].kill('SIGTERM');
            processes[target].on('exit', function (code) {
                done(true)
            })
        }
    })

    function seleniumDL (options) {
        return options.urlMapping['selenium'].format(options['selenium'])
    }

    function chromeDL (options) {
        var o = options['chrome'],
            p = os.platform(),
            arch = os.arch()

        if (p.indexOf('win') === 0) {
            o.platform = 'win32'
        } else if (p === 'darwin') {
            o.platform = 'mac32'
        }
        else {
            o.platform = p + arch.replace('x', '')
        }

        return options.urlMapping['chrome'].format(o)
    }

    function ieDL (options) {
        var o = options['ie'],
            p = os.platform(),
            arch = os.arch()

        if (p.indexOf('win') === 0) {
            if (arch === 'x64') {
                o.platform = 'x64'
            }
            else {
                o.platform = 'Win32'
            }
            return options.urlMapping['ie'].format(o)
        } else {
            return ''
        }

    }


    // start selenium
    function ss (opt) {

        var args = ['-jar',
                    opt.destination,
                    '-Dwebdriver.chrome.driver=' + opt.downloadLocation + '/chromedriver'
                   ],
            defer = when.defer(),
            complete = false,
            hasSeleniumStarted = function(data) {
                grunt.verbose.writeln('>>> pulling data... ' + data.toString());

                if (data.toString().match(/Started SocketListener on .+:\d+/) && !complete) {
                    grunt.log.ok('Selenium server SocketListener started.');
                    complete = true;
                    defer.resolve()
                } else if (data.toString().indexOf('Error') >= 0) {
                    grunt.log.error('Selenium server SocketListener started.');

                }
            },
            timeoutHandler = function () {
                if (!complete) {
                    complete = true;
                    processes[opt.target].kill('SIGTERM');
                    defer.reject(new Error('Timeout waiting for selenium to start.  Check if an instance of selenium is already running.'));
                }
            }
        // allow further options
        Object.keys(opt.serverOptions).forEach(function (key) {
            args.push('-' + key);
            args.push(opt.serverOptions[key]);
        });

        Object.keys(opt.systemProperties).forEach(function (key) {
            args.push('-D' + key + '=' + opt.systemProperties[key]);
        });

        grunt.log.ok('Starting Selenium server...');
        grunt.verbose.writeln('Using (roughly) command: java ' + args.join(' '));

        // Spawn server process.
        processes[opt.target] = require('child_process').spawn('java', args)
        grunt.log.ok('geeting pid: ' + processes[opt.target].pid);

        // < 2.43.0 outputs to stdout
        processes[opt.target].stdout.on('data', hasSeleniumStarted);
        // >= 2.43.0 outputs to stdout
        processes[opt.target].stderr.on('data', hasSeleniumStarted);
        // Timeout case
        setTimeout(timeoutHandler, 30000)

        return defer.promise

    }

    /**
     * Fetch a file
     */
    function ff (opt, cb) {

        var url = opt.url,
            dest = opt.destination,
            writeStream,
            df = when.defer()

        if (!opt) {
            grunt.verbose.writeln('no option pass when downloading file')
            df.reject('URL is empty, nothing need to be download')
        }

        if (fs.existsSync(dest)) {
            grunt.verbose.writeln('file ' + dest + ' already exists')
            return df.resolve(dest + ' already exists')
        }

        writeStream = fs.createWriteStream(dest)
        grunt.verbose.writeln('Saving file to: ' + dest + ' => ' + url)

        request(url).on('response', function (res) {

            if(res.statusCode > 200 && res.statusCode < 300) {
                grunt.fail.fatal(url + ' returns ' + res.statusCode)
                grunt.log.writeln('you may like to download manually.')
                df.reject('cant download file ' + url)
            }

            var len = parseInt(res.headers['content-length'], 10),
                bar = new ProgressBar(' downloading [:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 20,
                    total: len
                })

            res.on('data', function (chunk) {
                writeStream.write(chunk)
                bar.tick(chunk.length)
            })

            res.on('end', function () {
                writeStream.end()

                // unzip the file it is.
                if (path.extname(dest) === '.zip') {
                    grunt.verbose.writeln('unzip ' + dest + ' -d ' + path.dirname(dest))
                    var unzip = child_process.exec('unzip ' + dest + ' -d ' + path.dirname(dest), [], function (error, stdout, stderr) {
                        if (error) {
                            grunt.verbose.error(error)
                            grunt.verbose.writeln("you may like to unzip manually the file " + dest)
                        }
                        grunt.verbose.writeln(stdout)
                        df.resolve(dest, null)
                    })
                } else {
                    grunt.verbose.writeln('.. finish downoald ' + dest)
                    df.resolve(dest, null)
                }

            })

            res.on('error', function (err) {
                df.reject()
            })
        })

        return df.promise

    }

    function np () {

    }

    function isNotEmpty (x) {
        return !!x
    }


}
