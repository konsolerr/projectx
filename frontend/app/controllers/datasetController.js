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
        
        $scope.datas = [];
        
        $http.get('/projectx/get/allowed_data_sets/').success(function(data) {
            $scope.allowed_datasets = data;
        }).then(function() {
            for (var i = 0; i < $scope.allowed_datasets.length; i++) {
                var name = $scope.allowed_datasets[i];
                $http.get('/projectx/get/' + name + '/').success(function(data) {
                    
                    $scope.datasets[name] = data;
                    $scope.datasets[name].real_methods = {};
                   
                    $http.get('/projectx/get/' + data['constructor'][0] + '/').success(function(data) {
                        $scope.datasets[name].real_constructor = data;
                    });
                    
                    for (var i = 0; i < $scope.datasets[name].methods.length; i++) {
                        var method_name = $scope.datasets[name].methods[i];
                        $http.get('/projectx/get/' + method_name + '/').success(function(data) {
                            $scope.datasets[name].real_methods[method_name] = data;
                        });
                    }
                });
            }
        });
        
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
                data.dataset  = $scope.current_dataset_creation;
                data.html = $sce.trustAsHtml(data['html'][0]);
                data.results = [];
                $scope.datas.push(data);
                console.log(data);
            });
            
        }
        
        $scope.getType = function(type) {
            var types = {
                number: "number",
                file: "file",
                dataset: "hidden"
            }
            return types[type];
        }
        
        $scope.submit = function(name, index) {
            var method = $scope.datas[index].dataset.real_methods[name];
            console.log(method);
            
            var fd = new FormData();
            var args = method.args;
            for (var arg in args) {
                if (args[arg].type[0] == "file") {
                    var file = document.getElementById(arg).files[0];
                    fd.append(arg, file);
                }
                if (args[arg].type[0] == "number") {
                    var number = $("#" + arg).val();
                    if (number != '') fd.append(arg, number);
                }
                if (args[arg].type[0] == 'dataset') {
                    fd.append(arg, $scope.datas[index].key);
                }
            }
            console.log(fd);
            $http.post('/projectx/create/' + method.exec + '/', fd, {
              headers: { 'Content-Type': undefined },
              transformRequest: angular.identity
            }).success(function(data){
                data.html = $sce.trustAsHtml(data['html'][0]);
                $scope.datas[index].results.push(data);
            });
            
        }
        
        
//    $http.get('/projectx/get-vector-functions/').success(function(data){
//        var funs = [];
//        for (var key in data) {
//            var tt = [key];
//            tt.push.apply(tt, data[key]);
//            funs.push(tt)
//        };
//        $scope.vectorFunctions = funs;
//    });
//
//    var addDataSet = function(data, inputs, results){
//        console.log(data);
//        $scope.datasets.push(
//            {
//                key: data['key'],
//                html: $sce.trustAsHtml(data['html'][0]),
//                inputs: inputs || [],
//                results: results || [],
//                toCutStart: 1,
//                toCutEnd: 10
//            }
//        );
//        $scope.calculateDataset($scope.datasets.length - 1);
//
//    };
//    $scope.datasets = [];
//    $scope.addNewDataset = function() {
//        $http.get('/projectx/get-new-dataset/').success(function(data){
//            addDataSet(data);
//        });
//    };
//    $scope.addNewDataset();
//
//    $scope.addInput = function(id) {
//        $scope.datasets[id].inputs.push(
//            {
//                fun: $scope.vectorFunctions[0],
//                args: {}
//            }
//        );
//        $scope.datasets[id].results.push({});
//        $scope.calculate(id, $scope.datasets[id].inputs.length - 1);
//    };
//    $scope.removeInput = function(datasetIndex, id) {
//        $scope.datasets[datasetIndex].inputs.splice(id, 1);
//        $scope.datasets[datasetIndex].results.splice(id, 1);
//
//    };
//
//    $scope.calculate = function(datasetId, inputId) {
//        var dataset = $scope.datasets[datasetId];
//        var data = dataset.dataset;
//        var args = dataset.inputs[inputId].args;
//        var valid_args = {};
//        for (key in args) {
//            if (args[key] != "") {
//                valid_args[key] = parseFloat(args[key]);
//            }
//        }
//        var url = '/projectx/op/' + dataset.key + '/' + dataset.inputs[inputId].fun[0] + '/';
//        req = {
//            url: url,
//            method: 'GET',
//            params: valid_args,
//            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
//        };
//        $http(req).success(
//            function(data){
//                console.log(data);
//                dataset.results[inputId].result = {
//                    'html': $sce.trustAsHtml(data['html'][0]),
//                    'key': data['key']
//                };
//            }
//        )
//    };
//
//    $scope.calculateDataset = function(datasetId) {
//        for (var i = 0; i < $scope.datasets[datasetId].inputs.length; i++) {
//            $scope.calculate(datasetId, i);
//        }
//    };
//
//
//    $scope.createCutDataset = function(datasetId) {
//        var dataset = $scope.datasets[datasetId];
//        var startIndex = dataset.toCutStart;
//        var endIndex = dataset.toCutEnd;
//        //THIS COPY IS SO DIRTY
//        var inputs = [];
//        for (var i = 0; i < dataset.inputs.length; i++) {
//            inputs.push({
//                fun: dataset.inputs[i].fun,
//                args: _.clone(dataset.inputs[i].args)
//            })
//        }
//        var results = JSON.parse(JSON.stringify(dataset.results));
//        console.log(dataset.key);
//        var req = {
//            method: 'GET',
//            params: {
//                'start': startIndex,
//                'end': endIndex
//            },
//            url: '/projectx/op/' + dataset.key + '/cut/'
//        };
//        console.log(req.url);
//        $http(req).success(function(data){
//            addDataSet(data, inputs, results);
//        });
});