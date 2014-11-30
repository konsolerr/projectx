/**
 * Created by askmebefore on 30.11.14.
 */
var projectx = angular.module('projectx', []);
projectx.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[');
  $interpolateProvider.endSymbol(']}');
});