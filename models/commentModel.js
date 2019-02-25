var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var commentSchema = Schema({
  comment: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  serviceRequestId: { type: Schema.Types.ObjectId, ref: 'serviceRequest' }
});

module.exports = mongoose.model('Comment', commentSchema);
