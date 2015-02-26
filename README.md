# grunt-wd-server

> grunt webdriver selenium server

## Introduction

> Download selenium jar/webdrives and start selenium server.

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-wd-server --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-wd-server');
```

## The "start_wd_server" task

### Overview
In your project's Gruntfile, add a section named `wd_server` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  start_wd_server: {
    options: {
      // Task-specific options go here.
    }
  },
});
```

### Options

#### options.selenium.version
Type: `String`
Default value: `2.44`

Selenium major version

#### options.selenium.serverOptions

Type: `Object`
Default value: empty

#### options.selenium.systemProperties

Type: `Object`
Default value: empty

#### options.chrome.version

Type: `String`
Default value: `'2.14'`

chrome webdrive major version

#### options.ie.version

Type: `String`
Default value: `'2.44'`

ie webdriver major version

#### options.downloadLocation

Type: `String`
Default value: `'dl'`

location for download selenium and webdrivers to

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  start_wd_server: {
    options: {}
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  wd_server: {
    options: {
      selenium: {
        version: '2.43'
      },
      chrome: {
        version: '2.13'
      }
    }
  },
});
```
## The "stop_wd_server" task

same usage to "start_wd_server"

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

### 0.1.0 - Wed 25 Feb 2015
  - download selenium.jar and chrome webdriver if not exists
  - start/stop server
