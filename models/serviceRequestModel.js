var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var serviceRequestSchema = Schema({
  status: String,
  description: { type: String, required: 'description required' },
  customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service' }
});

module.exports = mongoose.model('serviceRequest', serviceRequestSchema);
