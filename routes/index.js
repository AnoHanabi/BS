var express = require('express');
var router = express.Router();
var user_controller=require("../controllers/userController");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BS' });
});

router.get("/login",user_controller.user_login_get);

router.post("/login",user_controller.user_login_post);

router.get("/register",user_controller.user_register_get);

router.post("/register",user_controller.user_register_post);

module.exports = router;
