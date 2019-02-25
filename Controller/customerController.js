var userModel = require('../models/userModel');
var serviceRequestModel = require('../models/serviceRequestModel');
var bcrypt = require('bcryptjs');
var commonFunction = require('../module/commonFunction');
var commentModel = require('../models/commentModel');
exports.createRequest = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token || !req.body.description || !req.body.serviceId) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        var ans = commonFunction.verifyToken(token, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                if (data.userType == 'customer') {
                    var newRequest = req.body;
                    var addRequest = new serviceRequestModel({
                        status: 'Pending',
                        description: newRequest.description,
                        customerId: data._id,
                        serviceId: newRequest.serviceId
                    });
                    serviceRequestModel(addRequest).save((err, data) => {
                        if (err) {
                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                        } else {
                            res.json(commonFunction.sendResponse(200, 'Request Created', data));
                        }
                    });
                } else {
                    res.json(commonFunction.sendResponse(404, 'access not allowed', data));
                }
            }

        });
    }

}


exports.deleteRequest = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token || !req.body.serviceRequestId) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        commonFunction.verifyToken(token, function (data1) {
            if (!data1) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                if (data1.userType == 'customer') {

                    commonFunction.checkSerReqId(data1, req.body.serviceRequestId, (chk, serReqData) => {
                        if (chk) {
                            if (serReqData.status == 'Accepted') {
                                res.json(commonFunction.sendResponse(404, 'Cannot delete request as Request is already accepted', serReqData));
                            } else {

                                serviceRequestModel.findByIdAndRemove({ _id: req.body.serviceRequestId }, (err, data) => {

                                    if (err) {
                                        res.json(commonFunction.sendResponse(500, 'Server error while deleting request', err));
                                    } else {
                                        commentModel.remove({ serviceRequestId: req.body.serviceRequestId }, (err, data) => {
                                            if (err) {
                                                res.json(commonFunction.sendResponse(500, 'Server error while deleting comments of request', err));
                                            } else {
                                                res.json(commonFunction.sendResponse(200, 'Request Deleted', ''));
                                            }
                                        });
                                    }
                                });
                            }
                        }
                        else {
                            res.json(commonFunction.sendResponse(404, 'access not allowed', data1));
                        }
                    });


                } else {
                    res.json(commonFunction.sendResponse(404, 'access not allowed', data1));
                }
            }

        });
    }

}
