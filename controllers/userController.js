var User = require("../models/user");
var async = require('async');

exports.user_login_get = (req, res) => { res.send("user login get") };

exports.user_login_post = (req, res) => { res.send("user login post") };

exports.user_register_get = function (req, res, next) {
    async.parallel({
        users:function(callback){
            User.find(callback);
        }
    },function(err,results){
        if(err){return next(err);}
        res.render("user_register",{title:"user register",users:results.users});
    });
}

exports.user_register_post = [
    (req,res,next)=>{
        var user= new User({
            username:req.body.username,
            password:req.body.password
        });
        user.save(function(err){
            if(err){return next(err);}
            res.redirect("/");
        });
    }
];