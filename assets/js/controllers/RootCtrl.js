
angular.module('kraken').controller('RootCtrl', function ($rootScope, $state, $stateParams)
{
  $rootScope.safeApply = function (fn) {
    var $root = this.$root
    if (!$root) return fn()

    var phase = $root.$$phase
    if (phase === '$apply' || phase === '$digest') {
      if (fn && typeof(fn) === 'function') fn()
    } else {
      this.$apply(fn)
    }
  }

  $rootScope.$state = $state
  $rootScope.$stateParams = $stateParams
  $rootScope.location = location
})

