var Msg = require('../models/msg');
var Channel = require("../models/channel");
var Aggregation = require("../models/aggregation");
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

function base64ToAudio(base64Str, path, optionalObj) {


    if (!base64Str || !path) {
        throw new Error('Missing mandatory arguments base64 string and/or path string');
    }

    var optionalObj = optionalObj || {};
    var audioBuffer = decodeBase64Image(base64Str);
    var audioType = optionalObj.type || audioBuffer.type || 'png';
    var fileName = optionalObj.fileName || 'audio-' + Date.now();
    var abs;
    var fileName = '' + fileName;
    audioType = audioType.replace('audio/', '');
    fileName = fileName + '.' + audioType;
    abs = path + fileName;
    var base64Data = base64Str.substring(base64Str.indexOf(",") + 1);
    fs.writeFile(abs, base64Data, 'base64', function (err) {
        console.log(err);
    });

    return {
        'audioType': audioType,
        'fileName': fileName
    };
}




class SocketHandler {
    // storeAggregation(aggregation) {

    //     for (var i = 0; i < aggregation.channel.length; i++) {
    //         Channel.findOne({ "_id": aggregation.channel[i] })
    //             .exec(function (err, found_channel) {
    //                 for (var j = 0; j < found_channel.msg.length; j++) {
    //                     aggregation.update({
    //                         '$push': {
    //                             msg: found_channel.msg[j]
    //                         }
    //                     }, function (err) {
    //                         if (err) { return next(err); }
    //                     });
    //                 }
    //             });
    //     }

    // }
    storeMsg(data) {
        if (!data.uid) {
            var newMsg = new Msg({
                content: data.content,
                type: data.type
            });
        }
        else {

            if (data.type == "img") {
                var base64Str = data.content;
                var path = '/gitgui/BS/public/images/image/';
                var optionalObj = {};
                var imageInfo = base64ToImage(base64Str, path, optionalObj);
                var imgUrl = "<img src='/images/image/" + imageInfo.fileName + "'>";
                console.log(data);
                if (data.checked == true) {
                    imgUrl = "<button onclick='change(this)'>查看</button><div style='display:none'>" + imgUrl + "</div>";
                }
                var newMsg = new Msg({
                    content: imgUrl,
                    user: data.uid,
                    to: data.to,
                    type: data.type
                });
            }
            else {


                if (data.type == "audio") {
                    var base64Str = data.content;
                    var path = '/gitgui/BS/public/audio/';
                    var optionalObj = {};
                    var audioInfo = base64ToAudio(base64Str, path, optionalObj);
                    var audioUrl = "<audio controls src='/audio/" + audioInfo.fileName + "'/>";
                    if (data.checked == true) {
                        audioUrl = "<button onclick='change(this)'>查看</button><div style='display:none'>" + audioUrl + "</div>";
                    }
                    var newMsg = new Msg({
                        content: audioUrl,
                        user: data.uid,
                        to: data.to,
                        type: data.type
                    });
                }


                else if (data.to) {
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
