var Group = require("../models/group");
var async = require('async');
var User = require("../models/user");
var Channel = require("../models/channel");

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
                .exec(callback);
        },
        channel: function (callback) {
            Channel.findById(req.params.cid)
                .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        res.render('channel_detail', { title: 'Channel Detail', group: results.group, channel: results.channel });
    });
};