var Group = require("../models/group");
var async = require('async');
var User = require("../models/user");
var Channel = require("../models/channel");

function alertMessage(message, res) {
    var alert = `<script>alert('${message}');history.back();</script>`;
    res.send(alert);
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
        res.render("group_create", { title: "create group", groups: results.groups, channels: results.channels, err1: "" });
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
                    var group = new Group({
                        groupname: req.body.groupname,
                        user: req.cookies.uid,
                        channel: channel._id
                    });
                    group.save(function (err) {
                        if (err) { return next(err); }
                        res.render("group_create", { title: "create group", err1: "群组创建成功" });
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
            res.render("group_list", { tilte: "Group list", group_list: list_group });
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
                .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        res.render('channel_detail', { title: 'Channel Detail', group: results.group, channel: results.channel });
    });
};

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
                        res.render("channel_create", { title: "create channel", err1: "频道创建成功" });
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
        },
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