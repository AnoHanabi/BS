// socket = io.connect("ws://localhost:3001");
var socket = io.connect("ws://localhost:3001");


document.onkeydown = keyListener;
function keyListener(e) {
    if (e.keyCode == 13) {
        document.getElementById("bt").click();
    }
}

socket.on('connect', function () {
    var uid = getCookie("uid");
    socket.emit('join', uid);
});

document.getElementById('sendImage').addEventListener('change', function () {
    if (this.files.length != 0) {
        var file = this.files[0],
            reader = new FileReader();
        reader.onload = function (e) {
            this.value = '';

            var uid = getCookie("uid");
            var url = window.location.href;
            var arr = url.split("/");
            var len = arr.length;
            var cid = arr[len - 1];
            var data = {
                // content: "<img src='" + e.target.result + "'>",
                content: e.target.result,
                uid: uid,
                cid: cid,
                type: "img"
            };
            socket.emit("msg", data);

            // _displayImage('me', e.target.result);
        };
        reader.readAsDataURL(file);
    };
}, false);

// document.getElementById('sendImage').addEventListener('change', function () {

//     // var files = evt.target.files; // FileList object

//     // // Loop through the FileList and render image files as thumbnails.
//     // for (var i = 0, f; f = files[i]; i++) {

//     //     if (!f.type.match('image.*')) {
//     //         continue;
//     //     }

//     //     var reader = new FileReader();

//     //     // Closure to capture the file information.
//     //     reader.onload = (function (theFile) {
//     //         return function (e) {
//     //             // Render thumbnail.
//     //             document.getElementById("test").innerHTML = '!!!!!!!!!!!!!';
//     //             e.target.result

//     //             //   var span = document.createElement('span');
//     //             //   span.innerHTML = ['<img class="thumb" src="', e.target.result,
//     //             //                     '" title="', escape(theFile.name), '"/>'].join('');
//     //             //   document.getElementById('list').insertBefore(span, null);
//     //         };
//     //     })(f);

//     //     // Read in the image file as a data URL.
//     //     reader.readAsDataURL(f);
//     // }

//     if (this.files.length != 0) {
//         var file = this.files[0];
//         var reader = new FileReader();
//         reader.onload = function (e) {
//             this.value = '';
//             var uid = getCookie("uid");
//             var url = window.location.href;
//             var arr = url.split("/");
//             var len = arr.length;
//             var cid = arr[len - 1];

//             var base64Str = e.target.result;
//             var path = '/images/image/';
//             var optionalObj = { 'fileName': 'test' };
//             document.getElementById("test").innerHTML = path + optionalObj;
//             var imageInfo = base64ToImage(base64Str, path, optionalObj);
//             var data = {
//                 content: "<img src='" + imageInfo + "'>",
//                 // content: e.target.result,
//                 uid: uid,
//                 cid: cid,
//                 type: "img"
//             };
//             socket.emit("msg", data);

//             // _displayImage('me', e.target.result);
//         };
//         reader.readAsDataURL(file);
//     };
// }, false);

// socket.on('newImg', function (img) {
//     _displayImage(img);
// });

// function _displayImage(imgData) {
// var container = document.getElementById('msg'),
//     msgToDisplay = document.createElement('p');
// msgToDisplay.innerHTML = "img(src='" + imgData + "')";
// container.appendChild(msgToDisplay);
//     document.getElementById("test").innerHTML = '\nimg(src="' + imgData + '")';
// }

document.querySelector("button").addEventListener("click", () => {
    Send();
});

$(document).ready(function () {
    scroll();
});

function getCookie(uid) {
    var name = uid + "=";
    var ca = document.cookie.split(';');
    var c = ca[0].trim();
    return c.substring(name.length, c.length);
}


// socket.on('disconnect', function () {
//     var uid = getCookie("uid");
//     socket.emit('leave', uid);
// });

//channel chat
function Send() {
    var msg = document.querySelector("#m").value;
    var uid = getCookie("uid");
    var url = window.location.href;
    var arr = url.split("/");
    var len = arr.length;
    var cid = arr[len - 1];
    msg = _showEmoji(msg);
    var data = {
        content: msg,
        uid: uid,
        cid: cid
    };
    socket.emit("msg", data);
    document.querySelector('#m').value = '';
}

socket.on('msg', (obj) => {
    //location.reload();
    var url = window.location.href;
    var arr = url.split("/");
    var len = arr.length;
    var gid = arr[len - 3];
    var cid = arr[len - 1];
    var link = "/group/" + gid + "/channel/" + cid;
    var ans = link + " #msg";
    $("#msgDiv").load(ans);
    scroll();
});

function scroll() {
    var div = document.getElementById('msgDiv');
    div.innerHTML = div.innerHTML + '<br><br><br><br><br><br><br><br><br><br><br><br>';
    div.scrollTop = div.scrollHeight;
}

function _initialEmoji() {
    var emojiContainer = document.getElementById('emojiWrapper'),
        docFragment = document.createDocumentFragment();
    for (var i = 1; i <= 2; i++) {
        var emojiItem = document.createElement('img');
        emojiItem.src = '/images/emoji/' + i + '.gif';
        emojiItem.title = i;
        docFragment.appendChild(emojiItem);
    };
    emojiContainer.appendChild(docFragment);
}

_initialEmoji();

document.getElementById('emoji').addEventListener('click', function (e) {
    var emojiwrapper = document.getElementById('emojiWrapper');
    emojiwrapper.style.display = 'block';
    e.stopPropagation();
}, false);

document.body.addEventListener('click', function (e) {
    var emojiwrapper = document.getElementById('emojiWrapper');
    if (e.target != emojiwrapper) {
        emojiwrapper.style.display = 'none';
    };
});

document.getElementById('emojiWrapper').addEventListener('click', function (e) {
    var target = e.target;
    if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = document.getElementById('m');
        messageInput.focus();
        messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
    };
}, false);

function _showEmoji(msg) {
    var match, result = msg,
        reg = /\[emoji:\d+\]/g,
        emojiIndex,
        totalEmojiNum = document.getElementById('emojiWrapper').children.length;
    while (match = reg.exec(msg)) {
        emojiIndex = match[0].slice(7, -1);
        if (emojiIndex > totalEmojiNum) {
            result = result.replace(match[0], '[X]');
        } else {
            result = result.replace(match[0], '<img src="/images/emoji/' + emojiIndex + '.gif" />');
        };
    };
    return result;
}

