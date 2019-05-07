var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var AggregationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    group: { type: Schema.Types.ObjectId, ref: 'Group' },
    channel: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
    msg: [{ type: Schema.Types.ObjectId, ref: 'Msg' }]
});

module.exports = mongoose.model('Aggregation', AggregationSchema);