
angular.module('kraken').controller('HomeCtrl', function (
  $scope, $modal, $q, $timeout, krAPI, flash)
{
  var candidates = null
  var organizations = null

  $scope.reputation = {
    isDisabled: false,
    isOpen: false,

    options: {
      "big-data": "Prioritize big data background",
      "ux": "Prioritize UX background",
      "schools": "Prioritize top schools",
      "banking": "Prioritize finance background"
    }
  }

  $q.all([
    krAPI.candidates.get(),
    krAPI.organizations.get()
  ]).then(function (data) {
    candidates    = data[0]
    organizations = data[1]

    console.log('#candidates', candidates.length)
    console.log('#organizations', organizations.length)

    $scope.safeApply(function () {
      $scope.candidates    = candidates
      $scope.organizations = organizations
    })
  }, function (err) {
    var msg = "Failed to fetch demo data."
    console.error(msg, err)
    flash.error = msg
  })

  $scope.onSelectPriority = function (option) {
    $scope.safeApply(function () {
      $scope.reputation.isOpen = false
      $scope.reputation.priority = option

      if (option) {
        $scope.reputation.priorityLabel = $scope.reputation.options[option]
      } else {
        delete $scope.reputation.priorityLabel
      }
    })
  }

  $scope.onSelectCandidate = function (candidate) {
    selectNode(candidate)

    $modal.open({
      templateUrl: 'assets/html/modal-candidate.html',
      controller: 'ModalCandidateCtrl',
      resolve: {
        candidate:     function () { return candidate },
        organizations: function () { return $scope.organizations },
        priority:      function () { return $scope.reputation.priority }
      }
    }).result.finally(function () {
      deselectNode(candidate)
    })
  }

  $scope.onSelectOrganization = function (organization) {
    selectNode(organization)

    $modal.open({
      templateUrl: 'assets/html/modal-organization.html',
      controller: 'ModalOrganizationCtrl',
      resolve: { organization: function () { return organization } }
    }).result.finally(function () {
      deselectNode(organization)
    })
  }

  $scope.onSortCandidates = function () {
  }

  function selectNode (d) {
    $scope.$broadcast('select:node', d)
  }

  function deselectNode (d) {
    $scope.$broadcast('deselect:node', d)
  }

  $scope.$on('animation', function (event, isAnimating) {
    console.log('animation', isAnimating)

    $scope.safeApply(function () {
      $scope.reputation.isAnimating = isAnimating
    })
  })

  $scope.$on('dat.gui', function (event, data) {
    var c = []
    var o = []
    var i

    if (!candidates || !organizations) return

    for (i = 0; i < data['#candidates']; ++i) {
      c.push(candidates[i % candidates.length])
    }

    for (i = 0; i < data['#organizations']; ++i) {
      o.push(organizations[i % organizations.length])
    }

    $scope.safeApply(function () {
      $scope.candidates    = c
      $scope.organizations = o
    })
  })

  $timeout(function () {
    $('.enter').removeClass('enter')
  })
});

