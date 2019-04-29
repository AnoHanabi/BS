var Msg = require('../models/msg');
var Channel = require("../models/channel");


class SocketHandler {

    storeMsg(data) {
        var newMsg = new Msg({
            content: data.content,
            user: data.uid
        });
        newMsg.save();





        // Msg.update({ _id: newMsg._id }, {
        //     '$push': {
        //         username: newMsg._id
        //     }
        // }, function (err) {
        //     if (err) { return err; }

        // });

        Channel.update({ _id: data.cid }, {
            '$push': {
                msg: newMsg._id
            }
        }, function (err) {
            if (err) { return err; }
        });
    }

}

module.exports = SocketHandler;

// exports.SocketHandler = function (req, res, next) {
//     storeMsg(data) {
//         var newMsg = new Msg({
//             content: data.content,
//             time: Date.now,
//             user: req.cookies.uid
//         });
//         newMsg.save();
//         Channel.update({ _id: req.params.cid }, {
//             '$push': {
//                 msg: newMsg._id
//             }
//         }, function (err) {
//             if (err) { return next(err); }
//         });
//     }
// };
