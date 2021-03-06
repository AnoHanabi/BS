var express = require('express');
var router = express.Router();
var user_controller = require("../controllers/userController");

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get("/msg", user_controller.user_msg);

router.get("/logout",user_controller.user_logout);

router.get("/changepassword",user_controller.user_changepassword_get);

router.post("/changepassword",user_controller.user_changepassword_post);

router.get("/:uid",user_controller.user_chat);

router.get("/:uid/chat",user_controller.user_chat_chat);

router.get("/:uid/chat/:date",user_controller.user_chat_chat_date);

module.exports = router;
