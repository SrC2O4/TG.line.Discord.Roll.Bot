if (!process.env.mongoURL) return;
//Log everyday 01:00
const moment = require("moment");
const debugMode = (process.env.DEBUG) ? true : false;
const messageTimethenUpload = 50;
//50次 多少條訊息會上傳一次LOG
const oneHour = 1 * 60 * 60 * 1000;
//每一小時 24 * 60 * 60 * 1000 多久會上傳一次LOG紀錄 
const RollingLog = {
    RealTimeRollingLogfunction: {
        LastTimeLog: "",
        StartTime: "",
        LogTime: "",
        DiscordCountRoll: 0,
        DiscordCountText: 0
    }
};



var getState = async function () {
    let temp = {
        LogTime: Date(Date.now()).toLocaleString("en-US", {
            timeZone: "Asia/HongKong"
        }),
        StartTime: RollingLog.RealTimeRollingLogfunction.StartTime,
        LastTimeLog: RollingLog.RealTimeRollingLogfunction.LastTimeLog,
        DiscordCountRoll: RollingLog.RealTimeRollingLogfunction.DiscordCountRoll,
        DiscordCountText: RollingLog.RealTimeRollingLogfunction.DiscordCountText
    };
    RollingLog.RealTimeRollingLogfunction.LogTime = temp.LogTime;
    await records.settrpgSaveLogfunctionRealTime('RealTimeRollingLog', temp, () => {
        //console.log('SAVE REAL TIME LOG')
    });
    await getRecords();
    return RollingLog.RealTimeRollingLogfunction;
}
const records = require('./records.js');
var simpleCourt = 0;
getRecords();





async function courtMessage(result, botname, inputStr) {
    if (result && result.text) {
        //SAVE THE LOG
        if (simpleCourt != null) {
            switch (botname) {
                case "Discord":
                    (debugMode) ? console.log('Discord \'s inputStr: ', inputStr) : '';
                    RollingLog.RealTimeRollingLogfunction.DiscordCountRoll++;
                    break;
                default:
                    break;
            }
            simpleCourt++;
            //await saveLog();
        }
        return result;
    } else {
        if (simpleCourt != null) {
            switch (botname) {
                case "Discord":
                    RollingLog.RealTimeRollingLogfunction.DiscordCountText++;
                    break;
                default:
                    break;
            }
            simpleCourt++;

        }

    }
    await saveLog();
    return null;
}


//上傳用
async function saveLog() {
    if (!process.env.mongoURL) {
        return;
    }
    //假如沒有StartTime 或過了一天則上載中途紀錄到MLAB
    if (!RollingLog.RealTimeRollingLogfunction.StartTime) {
        RollingLog.RealTimeRollingLogfunction.StartTime = Date(Date.now()).toLocaleString("en-US", {
            timeZone: "Asia/HongKong"
        })
    }

    if (!RollingLog.RealTimeRollingLogfunction.LastTimeLog || Date.now() - RollingLog.RealTimeRollingLogfunction.LastTimeLog >= (oneHour)) {
        RollingLog.RealTimeRollingLogfunction.LastTimeLog = Date.now();
        //上傳中途紀錄MLAB
        // start today
        let start = moment().startOf('day');
        // end today
        let end = moment(start).endOf('day');
        //PUSH 推送
        let temp = {
            start: start,
            end: end,
            LogTime: Date(Date.now()).toLocaleString("en-US", {
                timeZone: "Asia/HongKong"
            }),
            DiscordCountRoll: RollingLog.RealTimeRollingLogfunction.DiscordCountRoll,
            DiscordCountText: RollingLog.RealTimeRollingLogfunction.DiscordCountText
        };
        records.maxTrpgSaveLogfunction('RollingLog', temp, () => {
            //console.log('SAVE LOG')

        })
    }
    //每50次上傳即時紀錄到MLAB
    if (!RollingLog.RealTimeRollingLogfunction.LastTimeLog || Date.now() - RollingLog.RealTimeRollingLogfunction.LastTimeLog >= (oneHour) || simpleCourt % messageTimethenUpload == 0 || simpleCourt == 1) {
        //simpleCourt % 50 == 0 || simpleCourt == 1
        //MLAB
        //RealTimeRollingLogfunction
        //SET 紀錄

        let temp = {
            LogTime: Date(Date.now()).toLocaleString("en-US", {
                timeZone: "Asia/HongKong"
            }),
            StartTime: RollingLog.RealTimeRollingLogfunction.StartTime,
            LastTimeLog: RollingLog.RealTimeRollingLogfunction.LastTimeLog,
            DiscordCountRoll: RollingLog.RealTimeRollingLogfunction.DiscordCountRoll,
            DiscordCountText: RollingLog.RealTimeRollingLogfunction.DiscordCountText


        };
        RollingLog.RealTimeRollingLogfunction.LogTime = temp.LogTime;
        records.settrpgSaveLogfunctionRealTime('RealTimeRollingLog', temp, () => {
            //console.log('SAVE REAL TIME LOG')
        });

    }
    //console.log("RollingLog: ", RollingLog)
    return null;
}

async function getRecords() {
    await records.get('RealTimeRollingLog', (msgs) => {
        if (msgs && msgs[0] && msgs[0].RealTimeRollingLogfunction)
            RollingLog.RealTimeRollingLogfunction = {
                LastTimeLog: msgs[0].RealTimeRollingLogfunction.LastTimeLog || "",
                StartTime: msgs[0].RealTimeRollingLogfunction.StartTime || "",
                LogTime: msgs[0].RealTimeRollingLogfunction.LogTime || "",
                DiscordCountRoll: msgs[0].RealTimeRollingLogfunction.DiscordCountRoll || 0,
                DiscordCountText: msgs[0].RealTimeRollingLogfunction.DiscordCountText || 0

            };
        //console.log('RollingLog', RollingLog)
        simpleCourt = 0;
    })
}

module.exports = {
    courtMessage,
    getState
};