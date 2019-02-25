var userModel = require('../models/userModel');
var serReqModel = require('../models/serviceRequestModel');
var serviceModel = require('../models/serviceModel');
exports.sendResponse = (statusCode, msg, data) => {
    var result = {
        status: statusCode,
        message: msg,
        data: data
    }
    return result;
}
var verifyToken = (token1, callback) => {
    var ans = true;
    userModel.findOne({ token: token1 }, (err, data) => {
        console.log(data);

        if (!data) {
            ans = false;
            console.log(err);
            callback(data);
        }
        else {

            ans = true;
            callback(data);
        }

    });

}

var checkSerReqId = (userData, serReqId, callback) => {
    console.log('a:' + userData);

    if (userData.userType == 'customer') {


        serReqModel.findOne({ customerId: userData._id, _id: serReqId }, (err, data) => {
            if (data) {
                console.log('w:' + data);

                callback(true, data);
            } else {
                callback(false, data);
            }
        });
    } else if (userData.userType == 'serviceProvider') {

        serReqModel.findOne({ _id: serReqId }).populate('serviceId').exec((err, dataCheck) => {
            console.log(dataCheck);
            if (err) {
                callback(false, dataCheck);
            }
            else if (dataCheck) {
                if (dataCheck.serviceId.serviceProviderId.equals(userData._id)) {
                    callback(true, dataCheck);
                } else {
                    callback(false, dataCheck);
                }
            } else {
                callback(false, dataCheck);
            }
        });
    }

}

var checkServiceId = (userData, serviceId, callback) => {
    serviceModel.findOne({ _id: serviceId, serviceProviderId: userData._id }, (err, dataCheck) => {
        console.log('find' + dataCheck);
        if (dataCheck) {
            callback(true, dataCheck);
        } else {
            callback(false, dataCheck);
        }
    });
}

exports.verifyToken = verifyToken;
exports.checkSerReqId = checkSerReqId;
exports.checkServiceId = checkServiceId;