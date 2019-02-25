var userModel = require('../models/userModel');
var bcrypt = require('bcryptjs');
var commonFunction = require('../module/commonFunction');
var serviceModel = require('../models/serviceModel');
var serviceRequestModel = require('../models/serviceRequestModel');
var commentModel = require('../models/commentModel');

const status = {
    Pending: ['Accepted', 'Rejected'],
    Accepted: 'Completed',
    Rejected: '',
    Completed: ''
};

function checkStatus(oldStatus, newStatus) {

    if (oldStatus == 'Pending') {
        var arr = status.Pending;
        if (newStatus == arr[0] || newStatus == arr[1]) {
            console.log('1' + true);
            return true;
        } else {
            console.log('1' + false);
            return false;
        }
    }
    else if (status[oldStatus] == newStatus) {
        console.log('2' + true);
        return true;
    }
    else {
        console.log('2' + false);
        return false;
    }

}
exports.addService = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token || !req.body.serviceName) {
        res.json(commonFunction.sendResponse(404, 'all fields required', ''));
    } else {
        var ans = commonFunction.verifyToken(token, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                if (data.userType == 'serviceProvider') {
                    var newService = req.body;
                    var addService = new serviceModel({
                        serviceName: newService.serviceName,
                        serviceProviderId: data._id
                    });
                    serviceModel(addService).save((err, data) => {
                        if (err) {
                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                        } else {
                            res.json(commonFunction.sendResponse(200, 'service Added', data));
                        }
                    });

                } else {
                    res.json(commonFunction.sendResponse(404, 'access not allowed', ''));
                }
            }

        });
    }

}

exports.updateService = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token || !req.body.serviceId || !req.body.serviceName) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        commonFunction.verifyToken(token, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                if (data.userType == 'serviceProvider') {
                    commonFunction.checkServiceId(data, req.body.serviceId, (chk, serData) => {
                        if (chk) {
                            serviceModel.findOneAndUpdate({
                                _id: req.body.serviceId
                            }, {
                                    $set: {
                                        serviceName: req.body.serviceName,
                                    }
                                }, function (err, data) {
                                    if (err) {
                                        res.json(commonFunction.sendResponse(500, 'Server error', ''));
                                    } else {
                                        res.json(commonFunction.sendResponse(200, 'Service Updated', data));
                                    }
                                });


                        } else {
                            res.json(commonFunction.sendResponse(404, 'access not allowed', data));
                        }
                    });
                } else {
                    res.json(commonFunction.sendResponse(404, 'access not allowed', data));
                }
            }

        });
    }

}

exports.deleteService = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token || !req.body.serviceId) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        commonFunction.verifyToken(token, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                if (data.userType == 'serviceProvider') {
                    commonFunction.checkServiceId(data, req.body.serviceId, (chk, serData) => {
                        if (chk) {
                            serviceRequestModel.find({ serviceId: req.body.serviceId, status: 'Accepted' }, (err, datac) => {
                                console.log('chk' + datac);
                                if (!datac.length) {
                                    serviceRequestModel.find({ serviceId: req.body.serviceId }, { _id: 1 }, (err, serReqArr) => {
                                        console.log('serReqArr' + serReqArr);
                                        if (serReqArr.length == 0) {
                                            serviceModel.findByIdAndRemove({ _id: req.body.serviceId }, (err, dataRemove) => {
                                                if (err) {
                                                    res.json(commonFunction.sendResponse(500, ' Error in deleting service', ''));
                                                } else {
                                                    res.json(commonFunction.sendResponse(200, ' Service Deleted', ''));
                                                }
                                            });
                                        } else {
                                            serviceModel.findByIdAndRemove({ _id: req.body.serviceId }, (err, data1) => {
                                                console.log(data1);
                                                serviceRequestModel.remove({ serviceId: req.body.serviceId }, (err, data2) => {
                                                    console.log(data1);
                                                    commentModel.deleteMany({ serviceRequestId: { $in: serReqArr } }, (err, dataCom) => {
                                                        if (err) {
                                                            res.json(commonFunction.sendResponse(500, ' Error in deleting comment', ''));
                                                        } else {
                                                            console.log(dataCom);
                                                            res.json(commonFunction.sendResponse(200, ' Service Deleted', ''));
                                                        }
                                                    });

                                                });

                                            });
                                        }
                                    });
                                } else {
                                    res.json(commonFunction.sendResponse(404, ' service request already accepted cannot delete service', ''));
                                }
                            });
                        } else {
                            res.json(commonFunction.sendResponse(404, 'access not allowed', data));
                        }

                    });

                } else {
                    res.json(commonFunction.sendResponse(404, 'access not allowed', data));
                }
            }
        });
    }
}



exports.getServiceList = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        serviceModel.find().populate().exec((err, data) => {
            if (err) {
                res.json(commonFunction.sendResponse(500, 'Server error', ''));
            } else {
                res.json(commonFunction.sendResponse(200, 'List of Services', data));
            }
        });
    }

}

exports.changeStatus = (req, res) => {
    var token = req.headers['x-access-token'];

    commonFunction.verifyToken(token, function (data) {
        if (!data) {
            res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', data));
        } else {
            if (data.userType == 'serviceProvider') {
                commonFunction.checkSerReqId(data, req.body.serviceRequestId, (chk, serReqData) => {
                    if (chk) {
                        serviceRequestModel.findOne({ _id: req.body.serviceRequestId }).populate('serviceId').exec((err, dataCheck) => {
                            var a = checkStatus(dataCheck.status, req.body.status);
                            console.log('qq' + a);
                            if (a) {
                                if (data._id.equals(dataCheck.serviceId.serviceProviderId)) {
                                    console.log("true");
                                    serviceRequestModel.findOneAndUpdate({
                                        _id: req.body.serviceRequestId
                                    }, {
                                            $set: {
                                                status: req.body.status
                                            }
                                        }, function (err, data) {
                                            if (err) {
                                                res.json(commonFunction.sendResponse(500, 'Server error', ''));
                                            } else {
                                                serviceRequestModel.findOne({ _id: req.body.serviceRequestId }, (err, dataUpdated) => {
                                                    if (err) {
                                                        res.json(commonFunction.sendResponse(500, 'Server error', ''));
                                                    } else {
                                                        res.json(commonFunction.sendResponse(200, 'Status Changed', dataUpdated));
                                                    }
                                                })

                                            }
                                        });
                                } else {
                                    console.log("false");
                                    res.json(commonFunction.sendResponse(404, 'access not allowed to this service', data));
                                }
                            } else {
                                res.json(commonFunction.sendResponse(404, 'Cannot change status', dataCheck));
                            }
                        });
                    } else {
                        res.json(commonFunction.sendResponse(404, 'access not allowed', data));
                    }
                });

            } else {
                res.json(commonFunction.sendResponse(404, 'access not allowed', data));
            }
        }
    });


}