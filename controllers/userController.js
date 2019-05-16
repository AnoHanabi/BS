var User = require("../models/user");
var async = require('async');
var Msg = require("../models/msg");
var pattern = /^[A-Za-z0-9]{8,12}$/;

exports.user_login_get = function (req, res, next) {
    async.parallel({
        users: function (callback) {
            User.find(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        res.render("user_login", { title: "user login", users: results.users, err1: "" });
    });
};

exports.user_login_post = [
    (req, res, next) => {
        User.findOne({ "username": req.body.username })
            .exec(function (err, found_user) {
                if (err) { return next(err); }
                if (found_user && found_user.password == req.body.password) {
                    res.cookie('uid', found_user._id.toString());
                    res.redirect("/users/msg");
                }
                else {
                    res.render("user_login", { title: "user login", err1: "账号或密码错误" });
                }
            });
    }
]

exports.user_register_get = function (req, res, next) {
    async.parallel({
        users: function (callback) {
            User.find(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        res.render("user_register", { title: "user register", users: results.users, err1: "" });
    });
};

exports.user_register_post = [
    (req, res, next) => {
        var user = new User({
            username: req.body.username,
            password: req.body.password
        });
        User.findOne({ "username": user.username })
            .exec(function (err, found_user) {
                if (err) { return next(err) }
                if (found_user) {
                    res.render("user_register", { title: "user register", err1: "账号已存在" });
                }
                else {
                    if (req.body.password == req.body.password2) {
                        if (pattern.test(req.body.password)) {
                            user.save(function (err) {
                                if (err) { return next(err); }
                                res.render("user_register", { title: "user register", err1: "注册成功" });
                            });
                        }
                        else {
                            res.render("user_register", { title: "user register", err1: "密码请设置为8-12位的数字字母组合" });
                        }
                    }
                    else {
                        res.render("user_register", { title: "user register", err1: "两次密码不一样" });
                    }
                }
            });
    }
];

exports.user_msg = function (req, res, next) {
    User.findOne({ "_id": req.cookies.uid })
        .exec(function (err, found_user) {
            if (err) { return next(err) }
            res.render("user_msg", { title: "user msg", user: found_user });
        });
};

exports.user_logout = function (req, res, next) {
    res.clearCookie("uid");
    res.redirect("/");
};

exports.user_chat = function (req, res, next) {
    async.parallel({
        msg: function (callback) {
            Msg.find(callback)
                .populate("user");
        },
        user: function (callback) {
            User.findById(req.params.uid)
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err); }
        res.render('user_chat', { title: 'User Chat', my_id: req.cookies.uid, msg: results.msg, user: results.user });
    });
}

exports.user_changepassword_get = function (req, res, next) {
    res.render('user_changepassword', { title: 'user changepassword', err1: "" });
};

exports.user_changepassword_post = [
    (req, res, next) => {
        User.findById(req.cookies.uid)
            .exec(function (err, found_user) {
                if (err) { return next(err) };
                if (req.body.oldpassword != found_user.password) {
                    res.render('user_changepassword', { title: 'user changepassword', err1: "旧密码错误" });
                }
                else if (req.body.newpassword != req.body.newpassword2) {
                    res.render('user_changepassword', { title: 'user changepassword', err1: "两次新密码不一致" });
                }
                else if (req.body.newpassword == req.body.oldpassword) {
                    res.render('user_changepassword', { title: 'user changepassword', err1: "新密码请勿与旧密码一致" });
                }
                else if (!pattern.test(req.body.newpassword)) {
                    res.render('user_changepassword', { title: 'user changepassword', err1: "密码请设置为8-12位的数字字母组合" });
                }
                else {
                    found_user.update({
                        "$set": {
                            password: req.body.newpassword
                        }
                    }, function (err) {
                        if (err) { return next(err); }
                        res.render('user_changepassword', { title: 'user changepassword', err1: "密码修改成功" });
                    });
                }
            });
    }
];