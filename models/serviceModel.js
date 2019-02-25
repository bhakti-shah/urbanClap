var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var serviceSchema = Schema({
    serviceName:String,
    serviceProviderId:{type:Schema.Types.ObjectId , ref:'User'}
});

module.exports=mongoose.model('Service',serviceSchema);
