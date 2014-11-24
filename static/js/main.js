var extend = function(obj1, obj2) {
    for (i in obj2) {
        obj1[i] = obj2[i];
    }
    return obj1;
}

var dataArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
var latestId = 1;


var jsonRequest = function(fun_name, data, success, error) {
    $.ajax({
        url: '/projectx/exec-json/' + fun_name + '/',
        type: 'post',
        //dataType: 'json',
        data: data,
        success: function (rs) {
            success(rs);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            error(jqXHR, textStatus, errorThrown)
        }
    });
};

var vectorFunction = function(fun_name) {
    return function(x, fun, args) {
        if (args === undefined) args = {};
        var another_args = extend({x: x}, args);
        jsonRequest(fun_name, {data: JSON.stringify(another_args)}, fun,
            function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus);
        });
    };
};

var vectorFunctions = {};

var handlers = function() {
    var ans = {};
    for (var i in vectorFunctions) {
        ans[i] = {
            fun: vectorFunction(i),
            arg_names: vectorFunctions[i][3]
        };
    }
    return ans;
};

var generateOptions = function() {
    var result_string = "";
    console.log(vectorFunctions);
    for (var i in vectorFunctions) {
        result_string += '<option value="' + vectorFunctions[i][1] + '">' + vectorFunctions[i][2] + '</option>';
    }
    return result_string
};

var generateArgs = function (id) {
    var id = id.toString();
    $("#ig-" + id).find("input[id^=args-]").parent().remove();
    var name = $("#select-" + id.toString()).val();
    console.log(name);
    var args = vectorFunctions[name][3];
    if (args !== undefined) {
        for (var i = 0; i < args.length; i++) {
            var id_name =  'args-'  + args[i] + '-' + id;
            $("#ig-" + id).append($("<div class='form-group col-md-2'><input type='text' placeholder='" + args[i] + "' class='form-control' id='" + id_name +"'></div>"));
        }
    }
};


var calculateBySelector = function(selector) {       
    selector.each(function(){
        var id = this.id.split("-")[1];
        var fun = function(data) {
            $("#result-" + id).val(data[0]);
        };
        var args = {};
        $("#ig-" + id).find("input[id^=args-]").each(function() {
            if (this.value) {
                args[this.id.split("-")[1]] = parseFloat(this.value);
            }
        });
        handlers()[this.value].fun(dataArray, fun, args);
    });
};


var calculateById = function(id){
    calculateBySelector($("#select-" + id.toString()));
};


var calculateAll = function() {
    calculateBySelector($("select[id^=select-]"));
};


var patternFunction = function() {
    return "<div class=\"row no-margin-row\" id=\"ig-xxx\"><div class=\"form-group col-md-2\"><button class=\"btn btn-default remove-btn\" type=\"button\" id=\"remove-xxx\">Remove</button></div><div class=\"form-group col-md-4\"><select class=\"form-control col-md-4\" id=\"select-xxx\">" + generateOptions() + '</select></div></div>';
};
var patternResult = function (){
    return "<div class=\"input-group\"><input type=\"text\" class=\"form-control\" id=\"result-xxx\" disabled=\"disabled\"></span></div>";
};


var rowBuilder = function(id) {
    return (patternFunction() + '|' + patternResult()).replace(/xxx/g, id.toString());
};

var refreshDataSet = function() {
    $("#data-set").text(makeNice(dataArray));
};

var makeNice = function(obj) {
    return obj.toString().replace(/,/g, ', ');
};

var addInput = function() {
    latestId ++;
    var html = rowBuilder(latestId).split("|");
    $(".input-groups").append($(html[0]));
    $("#results").append($(html[1]));
    generateArgs(latestId);
    calculateById(latestId);
};

$(document).ready(function(){
    $.ajax({
        url: '/projectx/get-vector-functions/',
        method: 'GET',
        dataType: 'json',
        success: function(data, textStatus, jqXHR) { vectorFunctions = data; console.log(vectorFunctions)}
   }).then(function() {
         console.log(vectorFunctions)
        addInput()
    });

    var fileCsv = $("#file-csv");
    refreshDataSet();
    fileCsv.bootstrapFileInput();
    
    fileCsv.on("change", function() {
        var myfile = fileCsv[0].files[0];
    });

    var $inputGroups = $('.input-groups');
    $inputGroups.on("change", "select", function(){
        var id = parseInt(this.id.split("-")[1]);
        generateArgs(id);
        calculateById(id);
    });
    
    $inputGroups.on("change", "input[id^=args-]", function(){
        var id = parseInt(this.id.split("-")[2]);
        calculateById(id);
    });
    
    $("#get-new-data-set").on("click", function(){
        jsonRequest('rnorm', {data: JSON.stringify({n: 100})},
        function(data) {
            dataArray = data;
            refreshDataSet();
            calculateAll();
            fileCsv.val("");
            fileCsv.parent().next().html("");
        }, null);
    });
    
    $inputGroups.on("click", ".remove-btn", function(){
        var id = this.id.split("-")[1];
        $("#ig-" + id).remove();
        $("#result-" + id).parent().remove();
    });
    
    $("#add-button").on("click", addInput);
});