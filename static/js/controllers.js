/**
 * Created by askmebefore on 25.11.14.
 */
var projectApp = angular.module('projectApp', []);
projectApp.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[');
  $interpolateProvider.endSymbol(']}');
});

projectApp.controller('DatasetController', function ($scope, $http) {
    $scope.vectorFunctions = [];
    $http.get('/projectx/get-vector-functions/').success(function(data){
        var funs = []
        for (var key in data) {
            var tt = [key];
            tt.push.apply(tt, data[key]);
            tt[4] = tt[4].slice(1);
            funs.push(tt)
        };
        $scope.vectorFunctions = funs;
    });

    $scope.datasets = [
        {
            dataset: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            inputs: [],
            results: [],
            toCutStart: 1,
            toCutEnd: 10
        }
    ];

    $scope.addNewDataset = function(dataset, inputs, results) {
        var dataset = dataset || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var inputs = inputs || [];
        var results = results || [];
        $scope.datasets.push({
            dataset: dataset,
            inputs: inputs,
            results: results,
            toCutStart: 1,
            toCutEnd: dataset.length
        });
        $scope.calculateDataset($scope.datasets.length - 1);
    };
    $scope.addInput = function(id) {
        $scope.datasets[id].inputs.push(
            {
                fun: $scope.vectorFunctions[0],
                args: {}
            }
        );
        $scope.datasets[id].results.push({});
        $scope.calculate(id, $scope.datasets[id].inputs.length - 1);
    };
    $scope.removeInput = function(datasetIndex, id) {
        $scope.datasets[datasetIndex].inputs.splice(id, 1);
        $scope.datasets[datasetIndex].results.splice(id, 1);

    };

    $scope.calculate = function(datasetId, inputId) {
        var dataset = $scope.datasets[datasetId];
        var data = dataset.dataset;
        var args = dataset.inputs[inputId].args;
        var valid_args = {x: data};
        for (key in args) {
            if (args[key] != "") {
                valid_args[key] = parseFloat(args[key]);
            }
        }
        var url = '/projectx/exec-json/' + dataset.inputs[inputId].fun[0] + '/';
        req = {
            url: url,
            method: 'POST',
            data: 'data=' + JSON.stringify(valid_args),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        };
        $http(req).success(
            function(data){
                dataset.results[inputId].result = data[0];
            }
        )
    };

    $scope.calculateDataset = function(datasetId) {
        for (var i = 0; i < $scope.datasets[datasetId].inputs.length; i++) {
            $scope.calculate(datasetId, i);
        }
    };

    $scope.getNormDataset = function(datasetId) {
        var url = '/projectx/exec-json/rnorm/';
        req = {
            url: url,
            method: 'POST',
            data: 'data=' + JSON.stringify({n: 100}),
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        };
        $http(req).success(
            function(data){
                $scope.datasets[datasetId].dataset = data;
                $scope.datasets[datasetId].toCutStart = 1;
                $scope.datasets[datasetId].toCutEnd = data.length;
                $scope.calculateDataset(datasetId);
            }
        )
    }

    $scope.niceDataset = function(dataset) {
        var dataset = dataset.toString();
        return dataset.replace(/,/g, ', ');
    };

    $scope.createCutDataset = function(datasetId) {
        var dataset = $scope.datasets[datasetId];
        var startIndex = dataset.toCutStart;
        var endIndex = dataset.toCutEnd;
        var data = dataset.dataset.slice(startIndex - 1, endIndex);
        //THIS COPY IS SO DIRTY
        var inputs = [];
        for (var i = 0; i < dataset.inputs.length; i++) {
            inputs.push({
                fun: dataset.inputs[i].fun,
                args: _.clone(dataset.inputs[i].args)
            })
        }
        var results = JSON.parse(JSON.stringify(dataset.results));
        $scope.addNewDataset(data, inputs, results);
    };
});
