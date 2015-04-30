/**
 * Created by askmebefore on 30.11.14.
 */
angular.module('projectx').controller(
    'DatasetController',
    function ($scope, $http, $sce, $q) {
    $scope.vectorFunctions = [];
        hljs.configure({tabReplace: '<span class="indent">\t</span>'});
        $scope.allowed_datasets = [];
        $scope.datasets = {};
        $scope.current_dataset_creation = null;
        $scope.current_selected_method = null;
        
        $scope.datas = [];
        $scope.active_data = null;
        
        $http.get('/projectx/data/get/allowed_data_sets/').success(function(data) {
            $scope.allowed_datasets = data;
            console.log(data);
        }).then(function() {
            var promises = [];
            for (var i = 0; i < $scope.allowed_datasets.length; i++) {
                var name = $scope.allowed_datasets[i];
                (function(e) {
                    promises.push($http.get('/projectx/data/get/' + name + '/').success(function(data) {
                        $scope.datasets[e] = data;
                    }));
                })(name);

            }
            $q.all(promises).then(function() {
                for (var i = 0; i < $scope.allowed_datasets.length; i++) {
                    var name = $scope.allowed_datasets[i];
                    (function(e) {
                        if (_.has($scope.datasets[e], "constructor")) {
                            $http.get('/projectx/data/post/' + $scope.datasets[e]['constructor'][0] + '/').success(
                                function (data) {
                                    $scope.datasets[e].real_constructor = data;
                                    $scope.current_dataset_creation = $scope.datasets[e];
                                }
                            );
                        }
                    })(name);
                }

            })

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
            data.dataset  = _.find($scope.datasets, function(x) { return x['class'] == data.className[0] });
            data.html = $sce.trustAsHtml(data['html'][0]);
            data.results = [];
            $http.get('/projectx/data/post/' + data.dataset.methods[0] + '/' + data.key + '/').success(
                function(data2){
                    data.methods = data2;
                    $scope.datas.push(data);
                    console.log(data2);
                    $scope.notBusy();
                }
            );
        };

        $scope.create_dataset = function() {
            $scope.busy();
            console.log($scope.datasets);
            var fd = new FormData();
            var args = $scope.current_dataset_creation.real_constructor.args;
            for (var arg in args) {
                if (args.hasOwnProperty(arg)){
                    if (args[arg].type[0] == "file") {
                        var file = document.getElementById(arg).files[0];
                        fd.append(arg, file);
                    }
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
                boolean: "checkbox",
                character: "text"
            };
            return types[type];
        };

        $scope.submit_action = function(data, name) {
            $scope.busy();
            var method = data.methods[name];

            var fd = new FormData();
            var args = method.args;
            for (var arg in args) {
                if (args.hasOwnProperty(arg)) {
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

                    if (args[arg].type[0] == "character") {
                        var value = $("#" + arg_name).val();
                        if (value != '') fd.append(arg, '"' + value + '"');
                    }

                    if (args[arg].type[0] == "boolean") {
                        var val = $("#" + arg_name + ":checked").length > 0;
                        if (number != '') fd.append(arg, val);
                    }
                }

            }
            fd.append('dataset', data.key);
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
                    $scope.notBusy();
                }
            });
            
        };

        $scope.constructorFilter = function(value) {
            return _.has($scope.datasets[value], "constructor");
        };

        $scope.busy = function () {
            $('#waitModal').modal({
                backdrop: 'static',
                keyboard: false
            })
        };

        $scope.notBusy = function () {
            $("#waitModal").modal("hide");
        }

});