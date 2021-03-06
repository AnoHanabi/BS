var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ChannelSchema = new Schema({
    channelname: { type: String, required: true },
    announce: { type: String, required: true },
    user: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    msg: [{ type: Schema.Types.ObjectId, ref: 'Msg' }]
});

module.exports = mongoose.model('Channel', ChannelSchema);