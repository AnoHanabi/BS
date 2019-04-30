var express = require('express');
var router = express.Router();
var user_controller = require("../controllers/userController");

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get("/msg", user_controller.user_msg);

router.get("/logout",user_controller.user_logout);

router.get("/:uid",user_controller.user_chat);

module.exports = router;
