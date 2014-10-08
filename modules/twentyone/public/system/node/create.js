/**
 * You must use `angular.module('node.crud').value('nodeConfig',{})` to specify which type of node you want to operate.
 * and use `angular.module('node.crud').value('indexConfig',[])` to specify which indexes node may have
 */
angular.module('node.create', ['node.index'])
  .controller( 'node.create', function( $http, $attrs,$scope,$rootScope){
    var type = $attrs['nodeType']
    if (!type ) {
      return console.log("You must use attr `node-create=[type]` to specify which type of node you want to operate.")
    }

    $scope.node = {
      title: '',
      content: ''
    }

    $scope.submit = function () {
      //TODO let user specify with validation rules
      if (!$scope.node.title || !$scope.node.content) {
        return alert('title or content cannot be null')
      }

      $http.post('/'+type, toPlainObject($scope.node)).success(function (node) {
        $rootScope.$broadcast(type + ".create.after", node)
      }).error(function (err) {
        $rootScope.$broadcast(type+".create.error", err)
      })
    }


    function toPlainObject(obj) {
      return JSON.parse(angular.toJson(obj))
    }
  })
