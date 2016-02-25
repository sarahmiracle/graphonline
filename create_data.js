
//requirements
var fs = require("fs-extra");
var deferred = require('deferred');
var exec = require('child_process').exec;
var configf = require('./config');
///////////////////////////////////////////////////////////////////////
// resolved deferred object
var resd = deferred();
resd.resolve();


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
            def.resolve();
        });
    return def.promise;
};
/////////////////////////////////////////////////////////////////////////////////////////


var process_parts = function(part,parts,path1,left,right,group_size)
{
    var def = deferred();

    if(part == parts)
    {
        def.resolve();
        return def.promise;
    }

    var path2 = path1 + '/' + part;
    if (!(fs.existsSync(path2))) fs.mkdirSync(path2);
    var work_dir = path2 + '/';
    if(fs.existsSync(work_dir + 'results'))
    {
        console.log('Error. The results file exists.  workdir: ' + work_dir);
        process_parts(part+1,parts,path1,left,right)(function(){
            def.resolve();
        });
        return def.promise;
    }
    resd.promise
    (function(){return make_graphs(work_dir.substr(1),left,right,part,parts);})
    (function(){return make_json(work_dir,group_size);})
    (function(){
            return process_parts(part+1,parts,path1,left,right,group_size);
        },
        function(err){
            console.log('error, part: ' + part);
            return process_parts(part+1,parts,path1,left,right,group_size);
        })
    (function(){
        def.resolve();
    }).done();

    return def.promise;
};

var start_program = function()
{
    if(process.argv.length!=7)
    {
        console.log('wrong number of arguments');
        console.log('usage: node tests.js left right start_part parts group_size');
        return;
    }
//  if(process.argv.length<5) {console.log('too few arguments'); return;}    /// auto_find
    // renaming argv
    var left = parseInt(process.argv[2]);
    var right = parseInt(process.argv[3]);
    var total = left + right;
    var start_part = parseInt(process.argv[4]);
    var parts = parseInt(process.argv[5]);
    var group_size = parseInt(process.argv[6]);

    var path1 = './data/' + total;
    if (!(fs.existsSync(path1))) fs.mkdirSync(path1);
    path1 += '/' + left + '_' + right;
    if (!(fs.existsSync(path1))) fs.mkdirSync(path1);

    process_parts(start_part,parts,path1,left,right,group_size)(function(){
        console.log('finished');
    },function(err)
    {
        console.log('Error:' + err);
    });
};

start_program();