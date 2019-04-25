var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var MsgSchema = new Schema({
    content: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Msg', MsgSchema);