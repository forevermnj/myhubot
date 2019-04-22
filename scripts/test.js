/**
 * 常用系统功能
 *
 * @example: sys p 30000 查找30000端口号的占用
 * @example: sys k 40000 杀死进程id为40000的进程
 * @example: sys f 50000 释放50000端口的占用（杀死起进程）
 * @author Tiago
 */


'use strict'

let spawn = require('cross-spawn');


function log(...res)
{
  console.log(...res);
}

/**
 * 获取命令的输出信息
 */
function getCommandOutput(cmd, arg1, arg2 = null, cb = null)
{
  arg1 = arg1 || [];
  arg2 = arg2 || {};
  let output = "";
  let handle = spawn(cmd, arg1, arg2);
  // 标准输出
  handle.stdout.on('data', (data) =>
  {
    //console.log('【捕获输出】:' + data);
    output = output + data.toString();
  });

  // 捕获标准错误输出并将其打印到控制台
  handle.stderr.on('data', (data) =>
  {
    console.log('【命令无法执行】:\n' + data);
  });

  // 注册子进程关闭事件
  handle.on('exit', (code, signal) =>
  {
    //console.log('【命令执行完毕】:', code, signal);
    if (code == 0 && cb)
    {
      cb(output);
    }
  });
}

/**
 * 解析NetStat的结果
 */
function parseNetStat(info)
{
  let res = {success: false};
  let idx = 0;
  for (let data of info.split(' '))
  {
    if (data == '')
    {
      continue;
    }
    switch (idx++)
    {
      case 0 :
        res.proto = data;
        break;
      case 1 :
        res.local = data;
        break;
      case 2 :
        res.foreign = data;
        break;
      case 3 :
        res.state = data;
        break;
      case 4 :
        res.pid = data;
        break;
    }
    if (idx == 4)
    {
      res.success = true;
    }
  }
  return res;
}


/**
 * 获取端口占用信息
 */
function getPortInfo(port, robot = null, res = null, cb = null)
{
  getCommandOutput('netstat', ['-ano'], null, (output) =>
  {
    let lineList = output.split("\r\n");
    let portStr = `:${port}`;
    let showInfo = `【${port}】\t 端口未被占用`;

    for (let info of lineList)
    {
      let data = parseNetStat(info);
      if (data.success == false)
      {
        continue;
      }

        if (data.success == false ||
      data.local.indexOf(portStr) == -1)
    {
      continue;
    }
        if (data.local.indexOf('::') != -1)
    {
      continue;
    }

      showInfo = `PID:${data.pid}\t${data.local} \t ${data.foreign}`;
      pid2Name(data.pid, robot, res);
      break
    }
    res ? res.send(showInfo) : console.log(showInfo);
  })
}

/**
 * 根据pid 杀死进程
 */
function killTask(pid)
{
  if (Number.parseInt(pid) == pid)
  {
    getCommandOutput('taskkill', ['/f', '/pid', pid]);
  }
  else
  {
    getCommandOutput('taskkill', ['/f', '/im', pid]);
  }

}

/**
 * 解析NetStat的结果
 */
function parseTaskList(info)
{
  let res = {success: false};
  let idx = 0;
  for (let data of info.split(' '))
  {
    if (data == '')
    {
      continue;
    }
    switch (idx++)
    {
      case 0 :
        res.name = data;
        break;
      case 1 :
        res.pid = data;
        break;
      case 2 :
        res.sessionName = data;
        break;
      case 3 :
        res.sessionId = data;
        break;
      case 4 :
        res.memory = data;
        break;
    }
    if (idx == 4)
    {
      res.success = true;
    }
  }
  return res;
}


/**
 * pid 转换为名字
 */
function pid2Name(pid, robot = null, res = null, cb = null)
{
  getCommandOutput('tasklist', [], null, (output) =>
  {
    let lineList = output.split("\r\n");
    let showInfo = `【${pid}】\t该进程不存在`;
    for (let info of lineList)
    {
      let data = parseTaskList(info);
      if (data.success == false || data.pid != pid)
      {
        continue;
      }
      showInfo = `${data.name}【PID : ${data.pid}】`
      break;
    }
    res ? res.send(showInfo) : console.log(showInfo);
  });
}

function create(name,robot = null, res = null, cb = null){
	 getCommandOutput('cmd.exe', ['/c', 'my.bat'])
}

module.exports = function (robot)
{
  robot.hear(/p (.*)/i, (res) => getPortInfo(res.match[1], robot, res));
  robot.hear(/sys p (.*)/i, (res) => getPortInfo(res.match[1], robot, res));
  robot.hear(/sys k (.*)/i, (res) => killTask(res.match[1], robot, res));
  robot.hear(/k (.*)/i, (res) => killTask(res.match[1], robot, res));
  robot.hear(/c (.*)/i, (res) => create(res.match[1], robot, res));
}
