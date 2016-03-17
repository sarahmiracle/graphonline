var fs = require("fs-extra");
var app = require('express')();
var http = require('http').Server(app);
var io;
var configf = require('./config');
var jsonpars = require('newline-json').Parser;


//--------------------------http part--------------------------//
var supporthttp = function() {
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });
    app.get('/program.js', function (req, res) {
        res.sendFile(__dirname + '/program.js');
    });
    app.get('/client.js', function (req, res) {
        res.sendFile(__dirname + '/client.js');
    });
};

//----------------------------process arguments------------------------------//
var g_left, g_right, g_part;
var process_arguments = function()
{
    if(process.argv.length!=5)
    {
        console.log('wrong number of arguments');
        console.log('usage: node app.js left rigt part');
        console.log('node app.js 6 10 0');
        return;
    }
    g_left = parseInt(process.argv[2]);
    g_right = parseInt(process.argv[3]);
    g_part = parseInt(process.argv[4]);
};

//----------------------------Client------------------------------//
var users_n = 0;
var serv_init = function() {
    io = require('socket.io')(http);
    io.on('connection', function (socket) {
        console.log('a user connected');
        users_n++;
        io.emit('users_n', users_n);
        socket.emit('ready', "?");
        socket.on('coloring', function (msg) {
            if (msg != 'yes') data.save_result(msg);
            var tmp = data.get_newdata();
            if (!data.no_data && tmp != null) socket.emit('color', tmp);
        });
        socket.on('disconnect', function () {
            console.log('user disconnected');
            users_n--;
            io.emit('users_n', users_n);
        });
    });
};

//-------------------------------Data------------------------------//
var queuemax = 300, queuemin = 250;
var data = {
    stream_end: false,
    no_data: false,
    folder: "",
    data_queue: [],
    serv_inited: false,
    init: function(left, right, part) {
        this.set_foldername(left, right, part);
        this.init_readfile();
        this.init_resultfile();
        this.init_buildqueue();
    },
    set_foldername: function(left, right, part) {
        var sum = left + right;
        this.folder = configf.curdir + "/data/" + sum + "/" + left + "_" + right +"/" + part;
    },
    getpath: function(){ return this.folder },
    getfpath: function(){ return this.folder + "/" },
    init_readfile: function() {
        var filepath = this.getfpath() + "upload";
        this.rstream = fs.createReadStream(filepath);

    },
    init_resultfile: function() {
        var filepath = this.getfpath() + "results";
        this.wstream = fs.createWriteStream(filepath, {flags: 'w', encoding: null, mode: 0666});
    },
    init_buildqueue: function(){
        this.jspar = new jsonpars();
        this.rstream.pipe(this.jspar);
        this.jspar.on('data', function(chunk)  {
//            console.log(chunk);
            data.data_queue.push(chunk);
            if(data.data_queue.length >= queuemax)
            {
                data.jspar.pause();
                if(!data.serv_inited) {
                    serv_init();
                    data.serv_inited = true;
                }
            }
        });
        this.jspar.on('end',function(){
            data.stream_end = true;
            if(!data.serv_inited) {
                serv_init();
                data.serv_inited = true;
            }
        });
    },
    get_newdata: function() {
        if(this.data_queue.length==0)
        {
            if(this.stream_end)
            {
                this.no_data = true;
                console.log('finished');
                return null;
            }
            else console.log("Error: queue was empty...");
        }
        var ret = this.data_queue.shift();
        if (this.data_queue.length < queuemin && !this.stream_end) this.jspar.resume();
        return ret;
    },
    save_result: function(data) {
        this.wstream.write(JSON.stringify(data) + "\n");
    }
};

//--------------------------Main function--------------------------//
http.listen(3000, function(){
    console.log('listening on *:3000');
});

var start_program = function()
{
    process_arguments();
    data.init(g_left, g_right, g_part);
    supporthttp();
};

start_program();