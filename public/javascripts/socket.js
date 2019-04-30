socket = io.connect("ws://localhost:3001");

document.onkeydown = keyListener;
function keyListener(e) {
    if (e.keyCode == 13) {
        document.getElementById("bt").click();
    }
}

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
                content: "<img src='" + e.target.result + "'>",
                // content: e.target.result,
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

socket.on('connect', function () {
    var uid = getCookie("uid");
    socket.emit('join', uid);
});

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