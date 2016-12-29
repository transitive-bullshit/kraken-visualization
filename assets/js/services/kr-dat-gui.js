angular.module('kraken').service('krDatGui', function ($timeout) {
  var gui  = null
  var cbs  = []
  var data = {
    // Physics
    'gravity': 0,
    'charge': -150,

    'linkSparsity': 5,
    // Links
    //'link-width': 2,
    //'link-alpha': 0.2
  }

  function onChange (key) {
    cbs.forEach(function (cb) {
      cb(data, key)
    })
  }

  this.get = function () {
    var f

    if (!gui) {
      gui = new dat.GUI()

      {
        f = gui.addFolder('Physics')
        f.add(data, 'gravity').min(0.0).max(1.0).onChange(onChange)
        f.add(data, 'charge').min(-500).max(0).onChange(onChange)
      }

      {
        f = gui.addFolder('Links')
        f.add(data, 'linkSparsity').min(1).max(10).step(1).onChange(onChange)
      }

      /*{
        f = gui.addFolder('Links')
        f.add(data, 'link-width').min(0.01).max(5.0).onChange(onChange)
        f.add(data, 'link-alpha').min(0.01).max(1.0).onChange(onChange)
      }*/

      gui.close()
    }

    return gui
  }

  this.data = function () {
    return data
  }

  this.addChangeListener = function (cb) {
    cbs.push(cb)
    $timeout(onChange)
  }
});
