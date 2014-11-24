var extend = function(obj1, obj2) {
    for (i in obj2) {
        obj1[i] = obj2[i];
    }
    return obj1;
}

var dataArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
var latestId = 1;
ocpu.seturl("//public.opencpu.org/ocpu/library/stats/R");


var setOcpuDefault = function () {
    ocpu.seturl("//public.opencpu.org/ocpu/library/stats/R");
};


var vectorFunction = function(library, name) {
    return function(x, fun, args) {
        if (args === undefined) args = {};
        ocpu.seturl("//public.opencpu.org/ocpu/library/" + library + "/R");
        console.log(name + " IS OUT");
        ocpu.call(name, extend({x: x}, args),
                  function (session) {
            console.log(name + " IS IN");
            fun(session)
        });
        setOcpuDefault();
    };
};

var vectorFunctions = {
    mean: ["base", "mean", "Mean"],
    sum: ["base", "sum", "Sum"],
    sd: ["stats", "sd", "Standart deviation"],
    length: ["base", "length", "Length"],
    mad: ["stats", "mad", "median absolute deviation", ["center", "constant"]],
    median: ["stats", "median", "median"]
}

var handlers = {};
for (var i in vectorFunctions) {
    handlers[i] = {
        fun: vectorFunction(vectorFunctions[i][0], vectorFunctions[i][1]),
        arg_names: vectorFunctions[i][3]
    };
};

var generateOptions = function() {
    var result_string = "";
    for (var i in vectorFunctions) {
        result_string += '<option value="' + vectorFunctions[i][1] + '">' + vectorFunctions[i][2] + '</option>';
    }
    return result_string
};

var generateArgs = function (id) {
    var id = id.toString();
    $("#ig-" + id).find("input[id^=args-]").parent().remove();
    var name = $("#select-" + id.toString()).val();
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
        var fun = function(session) {
            session.getObject(function(data){
                $("#result-" + id).val(data);
            })
        };
        var args = {}
        $("#ig-" + id).find("input[id^=args-]").each(function() {
            if (this.value) {
                args[this.id.split("-")[1]] = parseFloat(this.value);
            }
        });
        handlers[this.value].fun(dataArray, fun, args);
    });
};


var calculateById = function(id){
    calculateBySelector($("#select-" + id.toString()));
};


var calculateAll = function() {
    calculateBySelector($("select[id^=select-]"));
};


var patternFunction = '<div class="row no-margin-row" id="ig-xxx"><div class="form-group col-md-2"><button class="btn btn-default remove-btn" type="button" id="remove-xxx">Remove</button></div><div class="form-group col-md-4"><select class="form-control col-md-4" id="select-xxx">' + generateOptions() + '</select></div></div>';
var patternResult = '<div class="input-group"><input type="text" class="form-control" id="result-xxx" disabled="disabled"></span></div>';


var rowBuilder = function(id) {
    return (patternFunction + '|' + patternResult).replace(/xxx/g, id.toString());
}

var refreshDataSet = function() {
    $("#data-set").text(makeNice(dataArray));
}

var makeNice = function(obj) {
    return obj.toString().replace(/,/g, ', ');
}

var addInput = function() {
    latestId ++;
    var html = rowBuilder(latestId).split("|");
    $(".input-groups").append($(html[0]));
    $("#results").append($(html[1]));
    generateArgs(latestId);
    calculateById(latestId);
};

$(document).ready(function(){
    addInput();
    var fileCsv = $("#file-csv");
    refreshDataSet();
    fileCsv.bootstrapFileInput();
    
    fileCsv.on("change", function() {
        var myfile = fileCsv[0].files[0];

        console.log(myfile);
        ocpu.seturl("//public.opencpu.org/ocpu/library/utils/R");
        var req = ocpu.call("read.table", {
            "file" : myfile,
            "sep": ','
        }, function(session){
            session.getConsole(function(outtxt){
                console.log(outtxt);
            });
            session.getObject(function(data){
                console.log(data);
                dataArray = new Array();
                for (var o in data[0]) {
                    dataArray.push(data[0][o]);
                }
                refreshDataSet();
                calculateAll();
            });
        });
        setOcpuDefault();
    });
    
    $('.input-groups').on("change", "select", function(){
        var id = parseInt(this.id.split("-")[1]);
        generateArgs(id);
        calculateById(id);
    });
    
    $('.input-groups').on("change", "input[id^=args-]", function(){
        var id = parseInt(this.id.split("-")[2]);
        calculateById(id);
    });
    
    $("#get-new-data-set").on("click", function(){
        var req = ocpu.call("rnorm", {n: 100}, function(session){
            //retrieve the returned object async
            session.getObject(function(data){
                //data is the object returned by the R function
                dataArray = data;
                refreshDataSet();
                calculateAll();
                fileCsv.val("");
                fileCsv.parent().next().html("");
            });
        })
    });
    
    $('.input-groups').on("click", ".remove-btn", function(){
        var id = this.id.split("-")[1];
        $("#ig-" + id).remove();
        $("#result-" + id).parent().remove();
    });
    
    $("#add-button").on("click", addInput);
});