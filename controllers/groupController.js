var Group = require("../models/group");
var async = require('async');
var User = require("../models/user");
var Channel = require("../models/channel");
var Msg = require("../models/msg");
var FeedParser = require('feedparser');
var request = require('request');
var SocketHandler = require('./socketController');
var Aggregation = require("../models/aggregation");

function alertMessage(message, res) {
    if (message == "退出成功" || message == "解散频道成功" || message == "解散群组成功") {
        var alert = `<script>alert('${message}');window.location.href='/group';</script>`;
    } else {
        var alert = `<script>alert('${message}');history.back();</script>`;
    }
    res.send(alert);
}
function alertMessage1(message, res) {
    var alert = `<script>alert('${message}');history.back();</script>`;
    res.send(alert);
    return next();
}

exports.group_create_get = function (req, res, next) {
    async.parallel({
        groups: function (callback) {
            Group.find(callback);
        },
        channels: function (callback) {
            Channel.find(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        if (req.cookies.uid) {
            res.render("group_create", { title: "create group", groups: results.groups, channels: results.channels, err1: "" });
        }
        else {
            alertMessage("请先登录！", res);
        }
    });
};

exports.group_create_post = [
    (req, res, next) => {
        var channel = new Channel({
            channelname: "Default",
            announce: req.body.announce,
            user: req.cookies.uid
        });
        Group.findOne({ "groupname": req.body.groupname })
            .exec(function (err, found_group) {
                if (err) { return next(err) }
                if (found_group) {
                    res.render("group_create", { title: "create group", err1: "群组已存在" });
                }
                else {
                    channel.save(function (err) {
                        if (err) { return next(err); }
                    });
                    User.update({ _id: req.cookies.uid }, {
                        '$push': {
                            admin: channel._id
                        }
                    }, function (err) {
                        if (err) { return next(err); }
                        var group = new Group({
                            groupname: req.body.groupname,
                            user: req.cookies.uid,
                            channel: channel._id
                        });
                        group.save(function (err) {
                            if (err) { return next(err); }
                            res.render("group_create", { title: "create group", err1: "群组创建成功" });
                        });
                    });
                }
            });
    }
];

exports.group_list = function (req, res, next) {
    Group.find()
        .populate('channel')
        .sort([["groupname", "ascending"]])
        .exec(function (err, list_group) {
            if (err) {
                return next(err);
            }
            if (req.cookies.uid) {
                res.render("group_list", { tilte: "Group list", group_list: list_group });
            }
            else {
                alertMessage("请先登录！", res);
            }
        });
};

exports.channel_detail = function (req, res, next) {

    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate('channel')
                .exec(callback);
        },
        channel: function (callback) {
            Channel.findById(req.params.cid)
                .populate('user')
                // .populate("msg")
                .populate({
                    path: 'msg',
                    populate: {
                        path: 'user'
                    }
                })
                .exec(callback);
        },
        msg: function (callback) {
            Msg.find(callback)
                .populate("user");
        },
        aggregation: function (callback) {
            Aggregation.findOne({ "user": req.cookies.uid, "group": req.params.gid })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }

        // for (var i = 0; i < results.group.channel.length; i++) {
        //     console.log(results.group.channel[i].channelname);
        //     console.log(results.group.channel[i].user.length);
        //     if (results.group.channel[i].user.length == 0) {
        //         // console.log("!!!!!!!!!!!!");

        //         console.log(results.group.channel[i].channelname + " delete");
        //         results.group.update({
        //             "$pull": {
        //                 channel: results.group.channel[i]._id
        //             }
        //         }, function (err) {
        //             if (err) { return next(err); }

        //             for (var i = 0; i < results.aggregation2.length; i++) {
        //                 results.aggregation2[i].update({
        //                     "$pull": {
        //                         channel: results.group.channel[i]._id
        //                     }
        //                 }, function (err) {
        //                     if (err) { return next(err); }
        //                 });
        //             }

        //             Channel.remove({ "_id": results.group.channel[i]._id }, function (err) {
        //                 // console.log("!!!!!!!!!");
        //                 if (err) { return next(err); }
        //             });
        //         });

        //     }
        // }

        var user = 0;
        for (var i = 0; i < results.channel.user.length; i++) {
            if (results.channel.user[i]._id == req.cookies.uid) {
                user = 1;
                break;
            }
        }
        if (user == 0) {
            alertMessage("你不是该频道成员，请先add", res);
        }
        res.render('channel_detail', { title: 'Channel Detail', isRss: results.channel.channelname.indexOf("RSS-"), my_id: req.cookies.uid, msg: results.msg, group: results.group, channel: results.channel, aggregation: results.aggregation });
    });
};

exports.channel_detail_chat = function (req, res, next) {

    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                // .populate('channel')
                .exec(callback);
        },
        channel: function (callback) {
            Channel.findById(req.params.cid)
                // .populate('user')
                // .populate("msg")
                .populate({
                    path: 'msg',
                    populate: {
                        path: 'user'
                    }
                })
                .exec(callback);
        },
        // msg: function (callback) {
        //     Msg.find(callback);
        //     // .populate("user");
        // }
    }, function (err, results) {
        if (err) { return next(err); }
        res.render('channel_detail_chat', { title: 'channel detail chat', group: results.group, channel: results.channel });
    });
}

exports.channel_detail_chat_date = function (req, res, next) {
    async.parallel({
        channel: function (callback) {
            Channel.findById(req.params.cid)
                .populate({
                    path: 'msg',
                    populate: {
                        path: 'user'
                    }
                })
                .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        var chatDate = req.params.date;
        var year = chatDate.split("-")[0];
        var month = chatDate.split("-")[1];
        var day = chatDate.split("-")[2];
        var yearNum = parseInt(year);
        var monthNum = parseInt(month);
        var dayNum = parseInt(day);
        res.render('channel_detail_chat_date', { title: 'channel detail chat date', yearNum: yearNum, monthNum: monthNum, dayNum: dayNum, channel: results.channel });
    });
}

exports.channel_create_get = function (req, res, next) {
    async.parallel({
        groups: function (callback) {
            Group.find(callback);
        },
        channels: function (callback) {
            Channel.find(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        res.render("channel_create", { title: "create channel", groups: results.groups, channels: results.channels, err1: "" });
    });
};

exports.rss_create_get = function (req, res, next) {
    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate("channel")
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.group.channel[0].user[0] == req.cookies.uid) {
            res.render("rss_create", { title: "create rss", err1: "" });
        }
        else {
            alertMessage("你不是该群群主，无法创建RSS频道", res);
        }

    });
};


exports.channel_create_post = [

    (req, res, next) => {
        var channel = new Channel({
            channelname: req.body.channelname,
            announce: req.body.announce,
            user: req.cookies.uid
        });
        Group.findOne({ "_id": req.params.gid })
            .populate("channel")
            .exec(function (err, found_group) {
                if (err) { return next(err); }
                var found_channel = 0;
                for (var i = 0; i < found_group.channel.length; i++) {
                    if (found_group.channel[i].channelname == req.body.channelname) {
                        found_channel = 1;
                        break;
                    }
                }
                if (found_channel) {
                    res.render("channel_create", { title: "create channel", err1: "频道已存在" });
                }
                else {
                    channel.save(function (err) {
                        if (err) { return next(err); }
                    });
                    found_group.update({
                        '$push': {
                            channel: channel._id
                        }
                    }, function (err) {
                        if (err) { return next(err); }
                        User.update({ _id: req.cookies.uid }, {
                            '$push': {
                                admin: channel._id
                            }
                        }, function (err) {
                            if (err) { return next(err); }
                            res.render("channel_create", { title: "create channel", err1: "频道创建成功" });
                        });
                    });
                }
            });
    }
];

exports.rss_create_post = [
    (req, res, next) => {
        var channel = new Channel({
            channelname: "RSS-" + req.body.rssname,
            announce: req.body.link,
            user: req.cookies.uid
        });
        var rssname = "RSS-" + req.body.rssname;

        Group.findOne({ "_id": req.params.gid })
            .populate("channel")
            .exec(function (err, found_group) {
                if (err) { return next(err); }
                var found_channel = 0;
                for (var i = 0; i < found_group.channel.length; i++) {
                    if (found_group.channel[i].channelname == rssname) {
                        found_channel = 1;
                        break;
                    }
                }
                if (found_channel) {
                    res.render("rss_create", { title: "create rss", err1: "RSS频道已存在" });
                }
                else {

                    request(req.body.link)
                        .on('error', function (error) {
                            console.error(error);
                        })
                        .pipe(new FeedParser())
                        .on('error', function (error) {
                            console.error(error);
                        });

                    channel.save(function (err) {
                        if (err) { return next(err); }
                    });
                    found_group.update({
                        '$push': {
                            channel: channel._id
                        }
                    }, function (err) {
                        if (err) { return next(err); }
                        User.update({ _id: req.cookies.uid }, {
                            '$push': {
                                admin: channel._id
                            }
                        }, function (err) {
                            if (err) { return next(err); }
                            var socketHandler = new SocketHandler();
                            request(req.body.link)
                                .pipe(new FeedParser())
                                .on('meta', function (meta) {
                                    console.log('===== %s =====', meta.title);
                                })
                                .on('readable', function () {
                                    var stream = this, item;
                                    while (item = stream.read()) {
                                        // console.log('Got article: %s', item.title);
                                        var content = " <a href='" + item.link + "'>" + item.title + "</a>";
                                        var obj = {
                                            content: content,
                                            type: rssname,
                                            cid: channel._id
                                        };
                                        socketHandler.storeMsg(obj);
                                    }
                                });

                            res.render("rss_create", { title: "create rss", err1: "RSS频道创建成功" });
                        });
                    });
                }
            });
    }
];

exports.group_add = function (req, res, next) {
    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate("channel")
                .populate("user")
                .exec(callback);
        },
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        var found_user = 0;
        for (var i = 0; i < results.group.user.length; i++) {
            if (results.group.user[i].username == results.user.username) {
                found_user = 1;
                break;
            }
        }
        if (found_user) {
            alertMessage("你已经是该群成员，请直接join", res);
        }
        else {
            results.group.update({
                '$push': {
                    user: results.user._id
                }
            }, function (err) {
                if (err) { return next(err); }
                results.group.channel[0].update({
                    '$push': {
                        user: results.user._id
                    }
                }, function (err) {
                    if (err) { return next(err); }
                    alertMessage("加入成功", res);
                });
            });
        }
    });
};

exports.group_edit_get = function (req, res, next) {
    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate("channel")
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.group.channel[0].user[0] == req.cookies.uid) {
            res.render("group_edit", { title: "edit group", err1: "" });
        }
        else {
            alertMessage("你不是该群群主，无法修改群信息", res);
        }
    });
};

exports.group_edit_post = [
    (req, res, next) => {
        Group.findById(req.params.gid)
            .exec(function (err, found_group) {
                if (err) { return next(err); }
                if (req.body.groupname == found_group.groupname) {
                    res.render("group_edit", { title: "edit group", err1: "请勿与原群名重复" });
                }
                else {
                    Group.findOne({ "groupname": req.body.groupname })
                        .exec(function (err, found_group2) {
                            if (err) { return next(err); }
                            if (found_group2) {
                                res.render("group_edit", { title: "edit group", err1: "请勿与其他群名重复" });
                            }
                            else {
                                found_group.update({
                                    "$set": {
                                        groupname: req.body.groupname
                                    }
                                }, function (err) {
                                    if (err) { return next(err); }
                                });
                                res.render("group_edit", { title: "edit group", err1: "修改成功" });
                            }
                        });
                }
            });
    }
];

exports.channel_detail_edit_get = function (req, res, next) {
    async.parallel({
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        var isAdmin = 0;
        for (var i = 0; i < results.user.admin.length; i++) {
            if (results.user.admin[i] == req.params.cid) {
                isAdmin = 1;
                break;
            }
        }
        if (isAdmin) {
            res.render("channel_edit", { title: "edit channel", err1: "" });
        }
        else {
            alertMessage("你不是该频道管理员，无法修改频道信息", res);
        }
    });
};

exports.channel_detail_edit_post = [
    (req, res, next) => {
        Channel.findOne({ "channelname": req.body.channelname })
            .exec(function (err, found_channel) {
                if (err) { return next(err) }
                // console.log(found_channel._id);
                // console.log(req.params.cid);
                if (found_channel && found_channel._id != req.params.cid) {
                    res.render("channel_edit", { title: "edit channel", err1: "请勿与其他频道名重复" });
                }
                else {
                    Channel.findById(req.params.cid)
                        .exec(function (err, found_channel2) {
                            if (err) { return next(err); }
                            found_channel2.update({
                                "$set": {
                                    channelname: req.body.channelname,
                                    announce: req.body.announce
                                }
                            }, function (err) {
                                if (err) { return next(err); }
                            });
                            res.render("channel_edit", { title: "edit channel", err1: "修改成功" });
                        });
                }
            });
    }
];

exports.channel_detail_delete = function (req, res, next) {
    async.parallel({
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        },
        group: function (callback) {
            Group.findById(req.params.gid)
                .exec(callback);
        },
        channel: function (callback) {
            Channel.findById(req.params.cid)
                .exec(callback);
        },
        aggregation: function (callback) {
            Aggregation.find()
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        var isAdmin = 0;
        for (var i = 0; i < results.user.admin.length; i++) {
            if (results.user.admin[i] == req.params.cid) {
                isAdmin = 1;
                break;
            }
        }
        if (isAdmin) {
            results.group.update({
                "$pull": {
                    channel: results.channel._id
                }
            }, function (err) {
                if (err) { return next(err); }
                for (var i = 0; i < results.aggregation.length; i++) {
                    results.aggregation[i].update({
                        "$pull": {
                            channel: results.channel._id
                        }
                    }, function (err) {
                        if (err) { return next(err); }
                    });
                }
                Channel.remove({ "_id": results.channel._id }, function (err) {
                    // console.log("!!!!!!!!!");
                    if (err) { return next(err); }
                });
            });
            alertMessage("解散频道成功", res);
        }
        else {
            alertMessage("你不是该频道管理员，无法解散频道", res);
        }
    });
};

exports.group_delete = function (req, res, next) {
    async.parallel({
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        },
        group: function (callback) {
            Group.findById(req.params.gid)
                .exec(callback);
        },
        aggregation: function (callback) {
            Aggregation.find()
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        var isAdmin = 0;
        for (var i = 0; i < results.user.admin.length; i++) {
            if (results.user.admin[i].toString() == results.group.channel[0].toString()) {
                isAdmin = 1;
                break;
            }
        }
        if (isAdmin) {
            // results.group.update({
            //     "$pull": {
            //         channel: results.channel._id
            //     }
            // }, function (err) {
            //     if (err) { return next(err); }
            //     for (var i = 0; i < results.aggregation.length; i++) {
            //         results.aggregation[i].update({
            //             "$pull": {
            //                 channel: results.channel._id
            //             }
            //         }, function (err) {
            //             if (err) { return next(err); }
            //         });
            //     }
            //     Channel.remove({ "_id": results.channel._id }, function (err) {
            //         // console.log("!!!!!!!!!");
            //         if (err) { return next(err); }
            //     });
            // });
            for (var i = 0; i < results.aggregation.length; i++) {
                if (results.aggregation[i].group == req.params.gid) {
                    console.log("gogogo");
                    Aggregation.remove({ "group": req.params.gid }, function (err) {
                        if (err) { return next(err); }
                    });
                }
            }
            for (var i = 0; i < results.group.channel.length; i++) {
                Channel.remove({ "_id": results.group.channel[i].toString() }, function (err) {
                    if (err) { return next(err); }
                });
            }
            Group.remove({ "_id": req.params.gid }, function (err) {
                if (err) { return next(err); }
            });
            alertMessage("解散群组成功", res);
        }
        else {
            alertMessage("你不是该群群主，无法解散该群", res);
        }
    });
};

exports.group_quit = function (req, res, next) {
    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate("user")
                .populate("channel")
                .exec(callback);
        },
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        var found_user = 0;
        for (var i = 0; i < results.group.user.length; i++) {
            if (results.group.user[i].username == results.user.username) {
                found_user = 1;
                break;
            }
        }
        if (found_user == 0) {
            alertMessage("你不是该群成员，无法退出", res);
        }
        else {
            for (var i = 0; i < results.group.channel.length; i++) {
                results.group.channel[i].update({
                    "$pull": {
                        user: results.user._id
                    }
                }, function (err) {
                    if (err) { return next(err); };
                });
            }
            results.group.update({
                '$pull': {
                    user: results.user._id
                }
            }, function (err) {
                if (err) { return next(err); }
                alertMessage("退出成功", res);
            });
        }
    });
};

exports.channel_detail_add = function (req, res, next) {
    async.parallel({
        channel: function (callback) {
            Channel.findById(req.params.cid)
                .populate("user")
                .exec(callback);
        },
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        var found_user = 0;
        for (var i = 0; i < results.channel.user.length; i++) {
            if (results.channel.user[i].username == results.user.username) {
                found_user = 1;
                break;
            }
        }
        if (found_user) {
            alertMessage("你已经是该频道成员了", res);
        }
        else {
            results.channel.update({
                '$push': {
                    user: results.user._id
                }
            }, function (err) {
                if (err) { return next(err); }
                alertMessage("加入成功", res);
            });
        }
    });
};

exports.channel_detail_quit = function (req, res, next) {
    async.parallel({
        channel: function (callback) {
            Channel.findById(req.params.cid)
                .populate("user")
                .exec(callback);
        },
        user: function (callback) {
            User.findById(req.cookies.uid)
                .exec(callback);
        },
        group: function (callback) {
            Group.findById(req.params.gid)
                .exec(callback);
        },
        aggregation: function (callback) {
            Aggregation.find({ "group": req.params.gid })
                .exec(callback);
        }
    }, function (err, results) {
        // console.log("!!!!!!!!!!!!");
        // console.log(results.aggregation);
        // console.log("!!!!!!!!!!!!");
        if (err) { return next(err); }
        var found_user = 0;
        for (var i = 0; i < results.channel.user.length; i++) {
            if (results.channel.user[i].username == results.user.username) {
                found_user = 1;
                break;
            }
        }
        if (found_user == 0) {
            alertMessage("你不是该频道成员，无法退出", res);
        }
        else {
            // console.log(results.channel.user.length);
            results.channel.update({
                '$pull': {
                    user: results.user._id
                }
            }, function (err) {
                if (err) { return next(err); }
                // console.log(results.channel.user.length);
                if (results.channel.user.length == 1) {
                    // console.log("!!!!!!!!!!!!");
                    results.group.update({
                        "$pull": {
                            channel: results.channel._id
                        }
                    }, function (err) {
                        if (err) { return next(err); }
                        for (var i = 0; i < results.aggregation.length; i++) {
                            results.aggregation[i].update({
                                "$pull": {
                                    channel: results.channel._id
                                }
                            }, function (err) {
                                if (err) { return next(err); }
                            });
                        }
                        Channel.remove({ "_id": results.channel._id }, function (err) {
                            // console.log("!!!!!!!!!");
                            if (err) { return next(err); }
                        });
                    });
                }
                alertMessage("退出成功", res);
            });
        }
    });
};

exports.aggregation_setting_get = function (req, res, next) {
    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate("channel")
                .exec(callback);
        },
        aggregation: function (callback) {
            Aggregation.findOne({ "user": req.cookies.uid, "group": req.params.gid })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        res.render("aggregation_setting", { title: "aggregation setting", group: results.group, aggregation: results.aggregation });
    });
};

exports.aggregation_setting_post = [
    (req, res, next) => {
        if (typeof (req.body.aggregation) == "string" || typeof (req.body.aggregation) == "undefined") {
            alertMessage1("请选择多个频道！", res);
        }
        Aggregation.findOne({ "user": req.cookies.uid, "group": req.params.gid })
            .populate("channel")
            .exec(function (err, found_aggregation) {
                if (found_aggregation) {

                    Aggregation.update({ _id: found_aggregation._id }, { $set: { channel: [], msg: [] } }, function (err) {

                        if (err) { return next(err); }
                        Group.findOne({ "_id": req.params.gid })
                            .populate('channel')
                            .exec(function (err, found_group) {
                                for (var i = 0; i < req.body.aggregation.length; i++) {
                                    for (var j = 0; j < found_group.channel.length; j++) {
                                        if (found_group.channel[j].channelname == req.body.aggregation[i]) {
                                            found_aggregation.update({
                                                '$push': {
                                                    channel: found_group.channel[j]._id
                                                }
                                            }, function (err) {
                                                if (err) { return next(err); }
                                            });
                                            for (var k = 0; k < found_group.channel[j].msg.length; k++) {
                                                found_aggregation.update({
                                                    '$push': {
                                                        msg: found_group.channel[j].msg[k]
                                                    }
                                                }, function (err) {
                                                    if (err) { return next(err); }
                                                });
                                            }
                                            break;
                                        }
                                    }
                                }
                            });
                    });
                    // res.redirect("/group/" + req.params.gid + "/aggregation/" + found_aggregation._id);

                }
                else {
                    var aggregation = new Aggregation({
                        user: req.cookies.uid,
                        group: req.params.gid
                    });
                    Group.findOne({ "_id": req.params.gid })
                        .populate("channel")
                        .exec(function (err, found_group) {
                            for (var i = 0; i < req.body.aggregation.length; i++) {
                                for (var j = 0; j < found_group.channel.length; j++) {
                                    if (found_group.channel[j].channelname == req.body.aggregation[i]) {
                                        aggregation.update({
                                            '$push': {
                                                channel: found_group.channel[j]._id
                                            }
                                        }, function (err) {
                                            if (err) { return next(err); }
                                        });
                                        for (var k = 0; k < found_group.channel[j].msg.length; k++) {
                                            aggregation.update({
                                                '$push': {
                                                    msg: found_group.channel[j].msg[k]
                                                }
                                            }, function (err) {
                                                if (err) { return next(err); }
                                            });
                                        }
                                        break;
                                    }
                                }
                            }
                        });
                    aggregation.save(function (err) {
                        if (err) { return next(err); }
                    });
                    // res.redirect("/group/" + req.params.gid + "/aggregation/" + aggregation._id);
                }
                alertMessage("创建成功！", res);
            });
    }
];

exports.aggregation_detail = function (req, res, next) {

    Aggregation.findOne({ "user": req.cookies.uid, "group": req.params.gid })
        .populate("channel")
        .exec(function (err, found_aggregation) {
            Aggregation.update({ _id: found_aggregation._id }, { $set: { msg: [] } }, function (err) {
                if (err) { return next(err); }
                for (var i = 0; i < found_aggregation.channel.length; i++) {
                    for (var j = 0; j < found_aggregation.channel[i].msg.length; j++) {
                        found_aggregation.update({
                            '$push': {
                                msg: found_aggregation.channel[i].msg[j]
                            }
                        }, function (err) {
                            if (err) { return next(err); }
                        });
                    }
                }
            });
        });

    async.parallel({
        group: function (callback) {
            Group.findById(req.params.gid)
                .populate('channel')
                .exec(callback);
        },
        aggregation: function (callback) {
            Aggregation.findOne({ "user": req.cookies.uid, "group": req.params.gid })
                .populate("channel")
                // .populate({ path: 'msg', options: { sort: { 'time': -1 } } })
                .populate({
                    path: 'msg', options: { sort: { 'time': 1 } },
                    populate: {
                        path: 'user'
                    }
                })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }

        res.render("aggregation_detail", { title: "aggregation detail", aggregation: results.aggregation, group: results.group });
    });
};