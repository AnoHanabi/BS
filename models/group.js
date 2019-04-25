var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var GroupSchema = new Schema({
    groupname: { type: String, required: true },
    user: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    channel: [{ type: Schema.Types.ObjectId, ref: 'Channel' }]
});

module.exports = mongoose.model('Group', GroupSchema);