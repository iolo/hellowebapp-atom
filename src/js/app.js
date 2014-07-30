(function (angular) {
    'use strict';

    var module = angular.module('app', []);

    module.run(['$rootScope', function (root) {
        root.nodeVersion = process.version;
        root.atomShellVersion = process.versions['atom-shell'];
    }]);

}(angular));
