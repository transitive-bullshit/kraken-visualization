angular.module('kraken').service('krAPI', function ($http) {
  this.candidates = {
    get: function (opts) {
      opts = _.extend({
        offset: 0,
        limit: 100
      }, opts || {})

      return $http.get('https://fisch0920.github.io/kraken-visualization/assets/data/candidates2.json', { params: opts })
        .then(function (response) {
          return response.data.candidates
        })
    }
  }

  this.organizations = {
    get: function (opts) {
      opts = _.extend({
        offset: 0,
        limit: 100
      }, opts || {})

      return $http.get('https://fisch0920.github.io/kraken-visualization/assets/data/organizations2.json', { params: opts })
        .then(function (response) {
          return response.data.organizations
        })
    }
  }
});
