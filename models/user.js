var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    admin: [{ type: Schema.Types.ObjectId, ref: 'Channel' }]
});

UserSchema
    .virtual('idStr')
    .get(function () {
        return this._id.toString();
    });

module.exports = mongoose.model('User', UserSchema);