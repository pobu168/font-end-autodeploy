var express = require('express');
var router = express.Router();
// var router = express()
var exec = require('child_process').exec;

var http = require('http');
var url = require('url');

var res = null
var req = null
// 发布服务器所在目录
var projetPath = ''
// 分支名称
var branchName = ''
// 发布环境
var env = ''
// 目标服务器地址
var envIp = ''
// 缓存接口传递参数
var arg = {}
// 用户查看日志
var userLogs = []
// 管理员查看日志
var adminLogs = []

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials','true');
    next();
};
router.use(allowCrossDomain);
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/post', function(req, res, next) {
    res.send('xxxxxxxxxxxx');
});
// 多请求不影响接口调用
router.get('/deploy', function(req, res, next) {
    userLogs = []
    adminLogs = []
    console.log('部署开始：' + new Date().format('yyyy-MM-dd hh:mm:ss'))
    userLogs.push('部署开始：' + new Date().format('yyyy-MM-dd hh:mm:ss'))
    adminLogs.push('部署开始：' + new Date().format('yyyy-MM-dd hh:mm:ss'))
    arg = url.parse(req.url, true).query;
    projetPath = '../' + arg.projetPath;
    branchName = arg.branchName;
    env = arg.env;
    envIp = arg.envIp;
    userLogs.push('部署参数：' + JSON.stringify(arg))
    adminLogs.push('部署参数：' + JSON.stringify(arg))
    checkoutToMaster(res);//调用普通函数fun1
});

router.get('/loadUserLogs', function(req, res, next) {
    res.send(userLogs)
});
router.get('/loadAdminLogs', function(req, res, next) {
    res.send(adminLogs)
});


function checkoutToMaster (res) {
    var cmdStr = 'git checkout master';
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            userLogs.push("部署失败，请联系管理员")
            adminLogs.push('切换至master分支失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("切换至master分支");
            adminLogs.push('切换至master分支')
            deleteCurrentBranch (res)
        }
    });
}

function deleteCurrentBranch (res) {
    var cmdStr = 'git branch -d ' + branchName;
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            adminLogs.push('删除当前分支失败：' + stderr)
            checkoutNewBranch (res)
        } else {
            console.log("删除当前分支");
            adminLogs.push('删除当前分支')
            checkoutNewBranch (res)
        }
    });
}

function consoleCurrentBranch () {
    var cmdStr = 'git branch';
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            adminLogs.push('展示当前分支失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("当前分支:" +stdout);
            adminLogs.push('当前分支:'+stdout);
        }
    });
}


function checkoutNewBranch (res) {
    // var cmdStr = 'git checkout -B features-autoDeploy-20181027 origin/features-autoDeploy-20181027';
    var cmdStr = 'git checkout -B ' + branchName + ' origin/' + branchName;
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            adminLogs.push('切换至目标分支失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("获取新分支");
            adminLogs.push('切换至目标分支：' + branchName)
            consoleCurrentBranch()
            gitPull(res)
        }
    });
}

// 拉去最新代码
function gitPull (res) {
    var cmdStr = 'git pull';
    userLogs.push("获取最新代码")
    adminLogs.push('获取最新代码')
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            userLogs.push("获取最新代码失败，请联系管理员")
            adminLogs.push('获取最新代码失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("git pull");
            userLogs.push("获取最新代码成功")
            adminLogs.push('获取最新代码成功：' + stdout)
            buildProject (res)
        }
    });
}

function buildProject (res) {
    console.log('开始项目打包！')
    userLogs.push("开始项目打包！")
    adminLogs.push('开始项目打包！')
    userLogs.push("打包过程将持续1分钟……！")
    adminLogs.push("打包过程将持续1分钟……！")
    var cmdStr = 'npm run build:' + env;
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            userLogs.push("项目构建失败，请联系管理员")
            adminLogs.push('项目构建失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("项目打包完成");
            userLogs.push("项目构建完成！")
            adminLogs.push('项目构建完成！')
            chmodIndex (res)
        }
    });
}


function chmodIndex (res) {
    console.log('开始增加index.html权限！')
    var cmdStr = 'chmod -R 777 index.html';
    exec(cmdStr, {cwd: projetPath + '/dist'}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            adminLogs.push('index.html赋权失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("增加index.html权限完成");
            adminLogs.push('index.html赋权成功：' + stdout)
            chmodStatic (res)
        }
    });
}

function chmodStatic (res) {
    console.log('开始增加static权限！')
    var cmdStr = 'chmod -R 777 static';
    exec(cmdStr, {cwd: projetPath + '/dist'}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            adminLogs.push('static赋权失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("增加static权限完成");
            adminLogs.push('static赋权成功！：' + stdout)
            // console.log(data);
            chmodFavicon (res)
        }
    });
}

function chmodFavicon (res) {
    console.log('开始增加favicon.ico权限！')
    var cmdStr = 'chmod -R 777 favicon.ico';
    exec(cmdStr, {cwd: projetPath + '/dist'}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            adminLogs.push('favicon.ico赋权失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("增加favicon.ico权限完成");
            adminLogs.push('favicon.ico赋权成功！：' + stdout)
            // console.log(data);
            removeDist (res)
        }
    });
}


function removeDist (res) {
    console.log('开始转移dist！')
    var cmdStr = 'rsync -avPp dist/*   ' + envIp + ':/tmp/html/';
    exec(cmdStr, {cwd: projetPath}, function(err,stdout,stderr){
        if(err) {
            console.log('error:'+stderr);
            userLogs.push('项目部署失败，请联系管理员！')
            adminLogs.push('转移dist失败：' + stderr)
            userLogs.push("over")
            adminLogs.push("over")
            res.send('over')
        } else {
            console.log("转移完成");
            adminLogs.push('转移dist成功！')
            adminLogs.push('结束时间：' + new Date().format('yyyy-MM-dd hh:mm:ss'))
            userLogs.push('项目部署成功：' + stdout)
            userLogs.push('结束时间：' + new Date().format('yyyy-MM-dd hh:mm:ss'))
            console.log('结束时间：' + new Date().format('yyyy-MM-dd hh:mm:ss'))
            res.send('over')
            // console.log(data);
        }
    });
}

// 格式化时间
Date.prototype.format = function(fmt) {
    var o = {
        'M+' : this.getMonth()+1,                 // 月份
        'd+' : this.getDate(),                    // 日
        'h+' : this.getHours(),                   // 小时
        'm+' : this.getMinutes(),                 // 分
        's+' : this.getSeconds(),                 // 秒
        'q+' : Math.floor((this.getMonth()+3)/3), // 季度
        'S'  : this.getMilliseconds()             // 毫秒
    }
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+'').substr(4 - RegExp.$1.length))
    }
    for(var k in o) {
        if(new RegExp('('+ k +')').test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (('00'+ o[k]).substr((''+ o[k]).length)))
        }
    }
    return fmt
}


module.exports = router;
