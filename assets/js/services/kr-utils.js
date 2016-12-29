angular.module('kraken').service("krUtils", function () {
  var self = this

  self.Random = {
    sample: function (min, max) {
      min = min || 0
      max = max || 1

      return min + (max - min) * Math.random()
    },

    sampleInt: function (min, max) {
      return Math.round(self.Random.sample(min, max))
    }
  }
});
