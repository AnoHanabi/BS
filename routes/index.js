var express = require('express');
var router = express.Router();
var user_controller=require("../controllers/userController");
var group_controller=require("../controllers/groupController");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '可选择信息流的多频道WEB聊天系统' });
});

router.get("/login",user_controller.user_login_get);

router.post("/login",user_controller.user_login_post);

router.get("/register",user_controller.user_register_get);

router.post("/register",user_controller.user_register_post);

router.get("/group/create",group_controller.group_create_get);

router.post("/group/create",group_controller.group_create_post);

router.get("/group",group_controller.group_list);

router.get("/group/:gid/add",group_controller.group_add);

router.get("/group/:gid/edit",group_controller.group_edit_get);

router.post("/group/:gid/edit",group_controller.group_edit_post);

router.get("/group/:gid/quit",group_controller.group_quit);

router.get("/group/:gid/delete",group_controller.group_delete);

router.get("/group/:gid/channel/create",group_controller.channel_create_get);

router.post("/group/:gid/channel/create",group_controller.channel_create_post);

router.get("/group/:gid/channel/:cid",group_controller.channel_detail);

router.get("/group/:gid/channel/:cid/add",group_controller.channel_detail_add);

router.get("/group/:gid/channel/:cid/edit",group_controller.channel_detail_edit_get);

router.post("/group/:gid/channel/:cid/edit",group_controller.channel_detail_edit_post);

router.get("/group/:gid/channel/:cid/quit",group_controller.channel_detail_quit);

router.get("/group/:gid/channel/:cid/delete",group_controller.channel_detail_delete);

router.get("/group/:gid/channel/:cid/chat",group_controller.channel_detail_chat);

router.get("/group/:gid/channel/:cid/chat/:date",group_controller.channel_detail_chat_date);

router.get("/group/:gid/rss/create",group_controller.rss_create_get);

router.post("/group/:gid/rss/create",group_controller.rss_create_post);

router.get("/group/:gid/aggregation/setting",group_controller.aggregation_setting_get);

router.post("/group/:gid/aggregation/setting",group_controller.aggregation_setting_post);

router.get("/group/:gid/aggregation/:aid",group_controller.aggregation_detail);

module.exports = router;
