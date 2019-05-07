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


$(document).ready(function () {
    scroll();
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


document.querySelector("#bt").addEventListener("click", () => {
    Send();
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

function __log(data) {
    // log.innerHTML += "\n" + e + " " + (data || '');
    document.getElementById("log").innerHTML = data;

}

var audio_context;
var recorder;

function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    // __log('Media stream created.');
    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //__log('Input connected to audio context destination.');

    recorder = new Recorder(input);
    // __log('Recorder initialised.');
    __log("press 'record' to start");
}

function startRecording(button) {
    recorder && recorder.record();
    button.disabled = true;
    button.nextElementSibling.disabled = false;
    __log('Recording...');
}

function stopRecording(button) {
    recorder && recorder.stop();
    button.disabled = true;
    button.previousElementSibling.disabled = false;
    __log('Stopped recording.');

    // create WAV download link using audio data blob
    createDownloadLink();
    recorder.clear();
}

function createDownloadLink() {
    recorder && recorder.exportWAV(function (blob) {
        var fr = new FileReader();
        fr.onload = function (e) {
            console.log(e.target.result);
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
                type: "audio"
            };
            socket.emit("msg", data);

        };
        fr.readAsDataURL(blob);

        // var url = URL.createObjectURL(blob);
        // var li = document.createElement('li');
        // var au = document.createElement('audio');
        // var hf = document.createElement('a');

        // au.controls = true;
        // au.src = url;
        // hf.href = url;
        // hf.download = new Date().toISOString() + '.wav';
        // hf.innerHTML = hf.download;
        // li.appendChild(au);
        // li.appendChild(hf);
        // recordingslist.appendChild(li);
    });
}

document.querySelector("#recOpen").addEventListener("click", () => {
    init();
});

function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        //     __log('Audio context set up.');
        //     __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({
        audio: true
    }, startUserMedia, function (e) {
        __log('No live audio input: ' + e);
    });
};

function changeDate() {
    var chatDate = document.getElementById("date").value;
    var url = window.location.href;
    var link = url + "/" + chatDate;
    var ans = link + " #msg";
    $("#msgDiv").load(ans);
}

function getValue(checkbox) {
    checkbox.value=checkbox.nextElementSibling.innerHTML;
}