
//requirements
var fs = require("fs-extra");
var jsonpars = require('newline-json').Parser;
var deferred = require('deferred');
var exec = require('child_process').exec;
var configf = require('./config');
///////////////////////////////////////////////////////////////////////
// resolved deferred object
var resd = deferred();
resd.resolve();

/////////////////////////////////////////////////////////////////////////////////////////
// the function for making a job based on the dir location
// the dir should contain a file named "upload" created by the g6_jsoner tool
// as well as a file named "graphs" which isn't used here
// dir must end with '/'
/////////////////////////////////////////////////////////////////////////////////////////
var make_job = function(dir)
{
    var def = deferred();

    var filenamer = dir + "upload";
    var filenamew = dir + "results";
    var filenameinf = dir + "info.json";
    var data = fs.createReadStream(filenamer);
    var writef = fs.createWriteStream(filenamew, {flags: 'w', encoding: null, mode: 0666});
    var infofile = fs.createWriteStream(filenameinf, {flags: 'w', encoding: null, mode: 0666});

    var job = CrowdProcess(Run);

    data.on('open', function () {
        var jspar = new jsonpars();
        data.pipe(jspar);
        jspar.pipe(job);
    });
    var jobinfo = {errnum:0,cmpnum:0,id:""};
    job.on('data', function (result) {
        jobinfo.cmpnum++;
        writef.write(JSON.stringify(result) + "\n");
    });
    job.on('end', function () {
        infofile.write(JSON.stringify(jobinfo),function(){
            console.log("end");
            def.resolve();
        });
    });
    job.on('created', function (id) {
        console.log('id is: ' + id);
        jobinfo.id = id;
    });
    job.on('error', function (err) {
        jobinfo.errnum++;
    });

    return def.promise;
};
///////////////////////////////////////////////////////////////////////////
var make_graphs = function(work_dir,left,right,part,parts)
{
    var def = deferred();
    var execstr = configf.cygbash;
    execstr += " --login -c \"";
    execstr += configf.curdir;
    execstr += "/tools/nauty24r2/genbg -c -d2 ";
    execstr += left + " " + right + " " + part + "/" + parts + " ";
    execstr += configf.curdir;
    execstr += work_dir + "graphs\"";
    var child = exec(execstr,
        function (error, stdout, stderr) {
            def.resolve();
        });
    return def.promise;
};
/////////////////////////////////////////////////////////////////////////////////////////
var make_json = function(work_dir,group_size)
{
    var def = deferred();
    var jsoner_dir = "./tools/g6_args/Release/";
    var files = ["cpp1.exe","cpp1.obj","cpp1.pch","vc60.idb"];
    for(var i=0;i<files.length;i++)
        fs.copySync(jsoner_dir + files[i],work_dir + files[i]);
    var execstr = configf.curdir + work_dir.substr(1) + files[0] + " " + group_size;
    var child = exec(execstr,{cwd:configf.curdir + work_dir.substr(1)},
        function (error, stdout, stderr) {
            for(var i=0;i<files.length;i++)
                fs.removeSync(work_dir + files[i]);
            def.resolve();
        });
    return def.promise;
};
/////////////////////////////////////////////////////////////////////////////////////////
var check_results = function(work_dir)
{
    var i;
    var def = deferred();
    var check_dir = "./tools/error_finder/map_at_2000/";
    var files = ["cpp1.exe","cpp1.obj","cpp1.pch","vc60.idb"];
    for(i=0;i<files.length;i++)
        fs.copySync(check_dir + files[i],work_dir + files[i]);
    var execstr = configf.curdir + work_dir.substr(1) + files[0];
    var child = exec(execstr,{cwd:configf.curdir + work_dir.substr(1)},
        function (error, stdout, stderr) {
            for(i=0;i<files.length;i++) {
                setTimeout(function () {
                    fs.removeSync(work_dir + files[i]);
                }, 60*1000);
            }
        });
    def.resolve();
    return def.promise;
};
/////////////////////////////////////////////////////////////////////////////////////////
var parts_arr = [];

var process_parts = function(part_i,parts,path1,left,right,group_size)
{
    var def = deferred();

    if(part_i == parts_arr.length)
    {
        def.resolve();
        return def.promise;
    }
    var part = parts_arr[part_i];
    var path2 = path1 + '/' + part;
    if (!(fs.existsSync(path2))) fs.mkdirSync(path2);
    var work_dir = path2 + '/';
    if(fs.existsSync(work_dir + 'results'))
    {
        console.log('Error. The results file exists.  workdir: ' + work_dir);
        process_parts(part_i+1,parts,path1,left,right)(function(){
            def.resolve();
        });
        return def.promise;
    }
    resd.promise
    (function(){return make_graphs(work_dir.substr(1),left,right,part,parts);})
    (function(){return make_json(work_dir,group_size);})
    //(function(){return make_job(work_dir);})
    //(function(){return check_results(work_dir);})
    (function(){
            return process_parts(part_i+1,parts,path1,left,right,group_size);
        },
        function(err){
            console.log('error, part: ' + part);
            return process_parts(part_i+1,parts,path1,left,right,group_size);
        })
    (function(){
        def.resolve();
    }).done();

    return def.promise;
};

var start_program = function()
{
    if(process.argv.length!=7 && process.argv.length!=4)
    {
        console.log('wrong number of arguments');
        console.log('usage: node tests_new.js left right start_part parts group_size');
        console.log('OR node tests_new.js filename group_size');
        return;
    }
    if(process.argv.length==7)
    {
        var left = parseInt(process.argv[2]);
        var right = parseInt(process.argv[3]);
        var total = left + right;
        var start_part = parseInt(process.argv[4]);
        var parts = parseInt(process.argv[5]);
        for(var tmp1 = start_part;tmp1<parts;tmp1++) parts_arr.push(tmp1);
        var group_size = parseInt(process.argv[6]);
    }
    if(process.argv.length==4)
    {
        var nametmp = process.argv[2];
        if(nametmp[0]!='.') nametmp = './' + nametmp;
        var infofromfile = require(nametmp);


        var left = infofromfile.left;
        var right = infofromfile.right;
        var total = left + right;
        parts_arr = infofromfile.parts;
        var parts = infofromfile.parts_n;
        var group_size = parseInt(process.argv[3]);
    }

    var path1 = './data/' + total;
    if (!(fs.existsSync(path1))) fs.mkdirSync(path1);
    path1 += '/' + left + '_' + right;
    if (!(fs.existsSync(path1))) fs.mkdirSync(path1);

    process_parts(0,parts,path1,left,right,group_size)(function(){
        console.log('finished');
    },function(err)
    {
        console.log('Error:' + err);
    });
};

start_program();