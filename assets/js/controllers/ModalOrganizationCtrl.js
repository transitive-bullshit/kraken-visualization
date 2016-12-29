
angular.module('kraken').controller('ModalOrganizationCtrl', function (
  $scope, $modalInstance, organization)
{
  $scope.organization = organization

  $scope.accept = function () {
    $modalInstance.close()
  }
});

