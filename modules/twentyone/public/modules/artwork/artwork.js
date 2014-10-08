angular.module('ordinary.artwork',['ui.router','node.crud','ngVideo'])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('detail', {
          url : "/artwork/:artworkId",
          templateUrl: '/modules/artwork/detail'
        })
        .state('artwork', {
          url : "/artwork",
          templateUrl: '/modules/artwork/list'
        })

    }])
  .controller('ordinary.artwork',function($rootScope,$http){

}).controller('ordinary.artwork.detail',function( $scope,$http,$stateParams,video){
    $http.get('/artwork/'+$stateParams.artworkId).success(function(artwork){
      $scope.artwork = artwork
      if( artwork.file.url){
        video.addSource('webm', $scope.artwork.file.url)
      }else if( artwork.file.persistentId ){
        $http.get('/artwork/0/status').success(function(res){
          $scope.artwork.file.url = $scope.artwork.file.domain + "/" + res.key
          video.addSource('webm', $scope.artwork.file.url)
          //TODO 也许还在转码中
        }).error(function(err){
          console.log("err",err)
        })
      }else{
        console.log("wrong artwork")
      }
    }).error(function(err){
      console.log( err)
    })
  })