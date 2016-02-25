var socket = io();
var colored_graphs = 0;
var temp_result, w;
if(typeof(Worker) !== "undefined") {
    if(typeof(w) == "undefined") {
        w = new Worker('program.js');
    }
    w.onmessage = function (oEvent) {
        if(typeof(oEvent.data) == typeof([])) {
            socket.emit('coloring', oEvent.data);
            return;
        }
        if(oEvent.data == "C") {
            colored_graphs++;
            document.getElementById("gcount").innerHTML = "" + colored_graphs;
            return;
        }
        if(typeof(oEvent.data) == typeof("a")) {
            document.getElementById("graph").innerHTML = oEvent.data;
            return;
        }
/*        if(oEvent.data.info == 'tmpres') {
            temp_result = oEvent.data.value;
        }*/
    };
} else {
    document.getElementById("error_ww").innerHTML = "<H1>Sorry, your browser does not support Web Workers...</H1>\n" +
    "<H1>Please, change your browser</H1>";
}
var stop_work = function() {
    w.terminate();
    socket.emit('coloring',temp_result);
};

socket.on('stop',function(data){
    stop();
});

socket.on('color',function(data){
//    temp_result = [];
    w.postMessage(data);
});
socket.on('ready',function(data){
    if(typeof(Worker) !== "undefined") socket.emit('coloring', 'yes');
});
socket.on('users_n',function(cnt){
    document.getElementById("users_n").innerHTML = "" + cnt;
});