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

function getCookie(uid) {
    var name = uid + "=";
    var ca = document.cookie.split(';');
    var c = ca[0].trim();
    return c.substring(name.length, c.length);
}

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
    setTimeout(function () { scroll(); }, 100);
});

function scroll() {
    var h = document.querySelector("#msgDiv");
    h.scrollTo(0, h.scrollHeight);
}