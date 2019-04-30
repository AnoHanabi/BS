var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var MsgSchema = new Schema({
    content: { type: String, required: true },
    time: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    to:{ type: String }
});

module.exports = mongoose.model('Msg', MsgSchema);