var Msg = require('../models/msg');
var Channel = require("../models/channel");
var fs = require('fs');

function base64ToImage(base64Str, path, optionalObj) {


    if (!base64Str || !path) {
        throw new Error('Missing mandatory arguments base64 string and/or path string');
    }

    var optionalObj = optionalObj || {};
    var imageBuffer = decodeBase64Image(base64Str);
    var imageType = optionalObj.type || imageBuffer.type || 'png';
    var fileName = optionalObj.fileName || 'img-' + Date.now();
    var abs;
    var fileName = '' + fileName;
    imageType = imageType.replace('image/', '');
    fileName = fileName + '.' + imageType;
    abs = path + fileName;
    // fs.writeFile(abs, imageBuffer.data, 'base64', function (err) {
    //     console.log("WWWWWWWW");
    //     if (err && optionalObj.debug) {
    //         console.log("ERRRRRRRRRRR");
    //         console.log("File image write error", err);
    //     }

    // });
    // var base64Data = base64Str.replace(/^data:image\/png;base64,/, "");
    var base64Data = base64Str.substring(base64Str.indexOf(",") + 1);
    fs.writeFile(abs, base64Data, 'base64', function (err) {
        console.log(err);
    });

    return {
        'imageType': imageType,
        'fileName': fileName
    };
};

function decodeBase64Image(base64Str) {
    var matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var image = {};
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 string');
    }

    image.type = matches[1];
    // image.data = new Buffer(matches[2], 'base64');

    return image;
}

class SocketHandler {

    storeMsg(data) {

        if (data.type == "img") {
            var base64Str = data.content;
            var path = '/gitgui/BS/public/images/image/';
            var optionalObj = {};
            var imageInfo = base64ToImage(base64Str, path, optionalObj);
            var imgUrl = "<img src='/images/image/" + imageInfo.fileName + "'>";
            var newMsg = new Msg({
                content: imgUrl,
                user: data.uid,
                to: data.to,
                type: data.type
            });
        }
        else {
            if (data.to) {
                var newMsg = new Msg({
                    content: data.content,
                    user: data.uid,
                    to: data.to,
                    type: data.type
                });
            } else {

                var newMsg = new Msg({
                    content: data.content,
                    user: data.uid,
                    type: data.type
                });

            }
        }
        newMsg.save();
        // Msg.update({ _id: newMsg._id }, {
        //     '$push': {
        //         username: newMsg._id
        //     }
        // }, function (err) {
        //     if (err) { return err; }

        // });
        if (data.cid) {
            Channel.update({ _id: data.cid }, {
                '$push': {
                    msg: newMsg._id
                }
            }, function (err) {
                if (err) { return err; }
            });
        }
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
