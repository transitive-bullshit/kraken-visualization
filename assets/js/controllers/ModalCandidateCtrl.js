
angular.module('kraken').controller('ModalCandidateCtrl', function (
  $scope, $modalInstance, candidate, organizations, priority)
{
  $scope.candidate = candidate
  $scope.organizations = {}
  $scope.priority = priority


  organizations.forEach(function (organization) {
    $scope.organizations[organization.slug] = organization
  })

  $scope.accept = function () {
    $modalInstance.close()
  }
});

