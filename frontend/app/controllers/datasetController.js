/**
 * Created by askmebefore on 30.11.14.
 */
angular.module('projectx').controller(
    'DatasetController',
    function ($scope, $http, $sce) {
    $scope.vectorFunctions = [];
        $scope.allowed_datasets = [];
        $scope.datasets = {};
        $scope.current_dataset_creation = null;
        $scope.current_selected_method = null;
        
        $scope.datas = [];
        $scope.active_data = null;
        
        $http.get('/projectx/data/get/allowed_data_sets/').success(function(data) {
            $scope.allowed_datasets = data;
        }).then(function() {
            for (var i = 0; i < $scope.allowed_datasets.length; i++) {
                var name = $scope.allowed_datasets[i];
                $http.get('/projectx/data/get/' + name + '/').success(function(data) {
                    $scope.datasets[name] = data;
                    $scope.current_dataset_creation = $scope.datasets[$scope.allowed_datasets[0]];
                   
                    $http.get('/projectx/data/post/' + data['constructor'][0] + '/').success(function(data) {
                        $scope.datasets[name].real_constructor = data;
                        console.log(data.args);
                    });
                });
            }
            console.log($scope.datasets);
        });

        $scope.highlight_code = function() {
          $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
          });
        };

        $scope.changeActive = function(i) {
            $scope.active_data = $scope.datas[i];
            $scope.highlight_code();
        };

        $scope.add_data = function(data) {
            console.log(data);
            data.dataset  = $scope.current_dataset_creation;
            data.html = $sce.trustAsHtml(data['html'][0]);
            data.results = [];
            $http.get('/projectx/data/post/' + data.dataset.methods[0] + '/' + data.key + '/').success(
                function(data2){
                    data.methods = data2;
                    $scope.datas.push(data);
                }
            );
        };

        $scope.create_dataset = function() {
//            console.log($scope.current_dataset_creation);
//            console.log($scope.creation_form);
            var fd = new FormData();
            var args = $scope.current_dataset_creation.real_constructor.args;
            for (var arg in args) {
                if (args[arg].type[0] == "file") {
                    var file = document.getElementById(arg).files[0];
                    fd.append(arg, file);
                }
            }
            console.log(fd);
            $http.post('/projectx/create/' + $scope.current_dataset_creation.real_constructor.exec + '/', fd, {
              headers: { 'Content-Type': undefined },
              transformRequest: angular.identity
            }).success(function(data){
                $scope.add_data(data);
            });
            
        };
        
        $scope.getType = function(type) {
            var types = {
                number: "number",
                file: "file",
                dataset: "hidden",
                boolean: "checkbox"
            }
            return types[type];
        }
        
        $scope.submit_action = function(data, name) {
            console.log(name);
            var method = data.methods[name];
            console.log(method);
            
            var fd = new FormData();
            var args = method.args;
            for (var arg in args) {
                var arg_name = data.key + "-" + arg;
                if (args[arg].type[0] == "file") {
                    var file = document.getElementById(arg_name).files[0];
                    fd.append(arg, file);
                }
                if (args[arg].type[0] == "select") {
                    var select = $("#" + arg_name +" option:selected").text();
                    fd.append(arg, '"' + select + '"');
                }
                if (args[arg].type[0] == "number" || args[arg].type[0] == "integer") {
                    var number = $("#" + arg_name).val();
                    if (number != '') fd.append(arg, number);
                }
                if (args[arg].type[0] == "boolean") {
                    var val = $("#" + arg_name + ":checked").length > 0;
                    if (number != '') fd.append(arg, val);
                }
            }
            fd.append('dataset', data.key)
            console.log(fd);
            $http.post('/projectx/create/' + method.exec[0] + '/', fd, {
              headers: { 'Content-Type': undefined },
              transformRequest: angular.identity
            }).success(function(data2){
                if (method.modificator[0]) {
                    $scope.add_data(data2);
                } else {
                    console.log(data2);
                    data2.html = $sce.trustAsHtml(data2['html'][0]);
                    data.results.push(data2);
                }
            });
            
        }
        
});