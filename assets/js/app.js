/**
 * Angular application initialization
 */

angular.module('kraken', [
  'ngAnimate',
  'ui.router',
  'ui.bootstrap',
  'angular-flash.service',
  'angular-flash.flash-alert-directive',
  'angular-loading-bar'
])

angular.module('kraken').config(function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/")

  $stateProvider
    .state('home', {
      url: "/",
      templateUrl: "assets/html/home.html",
      controller: "HomeCtrl"
    })
})

