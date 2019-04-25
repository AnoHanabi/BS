var express = require('express');
var router = express.Router();
var user_controller=require("../controllers/userController");
var group_controller=require("../controllers/groupController");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BS' });
});

router.get("/login",user_controller.user_login_get);

router.post("/login",user_controller.user_login_post);

router.get("/register",user_controller.user_register_get);

router.post("/register",user_controller.user_register_post);

router.get("/group/create",group_controller.group_create_get);

router.post("/group/create",group_controller.group_create_post);

router.get("/group",group_controller.group_list);

router.get("/group/:gid/channel/:cid",group_controller.channel_detail);

module.exports = router;
