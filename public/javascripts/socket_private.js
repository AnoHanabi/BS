socket = io.connect("ws://localhost:3001");

document.onkeydown = keyListener;
function keyListener(e) {
    if (e.keyCode == 13) {
        document.getElementById("bt").click();
    }
}

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

function Send() {
    var msg = document.querySelector("#m").value;
    var uid = getCookie("uid");
    var url = window.location.href;
    var arr = url.split("/");
    var len = arr.length;
    var to = arr[len - 1];
    var data = {
        content: msg,
        uid: uid,
        to: to
        // cid: cid
    };
    socket.emit("msg", uid, to, data);
    document.querySelector('#m').value = '';
}

socket.on('msg', (from, to, obj) => {
    //location.reload();
    if (getCookie("uid") == from || getCookie("uid") == to) {

        var url = window.location.href;
        var arr = url.split("/");
        var len = arr.length;
        var uid = arr[len - 1];
        var link = "/users/" + uid;
        var ans = link + " #msg";
        $("#msgDiv").load(ans);
        scroll();
    }

});

function scroll() {
    var div = document.getElementById('msgDiv');
    div.innerHTML = div.innerHTML + '<br><br>';
    div.scrollTop = div.scrollHeight;
}