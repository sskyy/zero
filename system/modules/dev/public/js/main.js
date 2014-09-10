angular.module('dev',[]).controller("main",function($scope,$http){

  var simulateUrl = '/dev/simulate'

  $scope.url = '/post'
  $scope.method = 'get'
  $scope.data = {}
  $scope.send = function(){
    $http.post(simulateUrl,{url:$scope.url,method:$scope.method,data:$scope.data}).success(function(data){
      Painter.onDataSuccess(data)
    }).error(function(err){
      console.log(err)
    })
  }

  function reset(){
    $scope.newDataKey = ''
    $scope.newDataValue = ''
    $scope.newDataType = 'text'
  }

  $scope.deleteData = function( k ){
    delete $scope.data[k]
  }

  $scope.addData = function() {
    if (!$scope.newDataKey || !$scope.newDataValue) return false

    var newData = {}
    newData[$scope.newDataKey] = $scope.newDataValue
    angular.extend($scope.data, newData)
    console.log( $scope.data )
    reset()
  }
})

