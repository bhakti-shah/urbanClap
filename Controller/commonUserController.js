var userModel = require('../models/userModel');
var bcrypt = require('bcryptjs');
var commonFunction = require('../module/commonFunction');
var commentModel = require('../models/commentModel');
var serviceRequestModel = require('../models/serviceRequestModel');
var serviceModel = require('../models/serviceModel');
exports.registerUserDetails = (req, res) => {
    if (req.body.password) {
        password = bcrypt.hashSync(req.body.password, 8);
        var newUser = new userModel(
            {
                userName: req.body.userName,
                email: req.body.email,
                password: password,
                userType: req.body.userType,
                token: ''
            }
        );
    } else {
        res.json(commonFunction.sendResponse(404, 'Password required', ''));
    }
    newUser.save(function (err, Add) {
        if (err) {
            console.log(err);
            res.json(commonFunction.sendResponse(500, 'Insertion  failed. All field Required', err));
        }
        else {

            console.log(Add);
            res.json(commonFunction.sendResponse(200, 'Successfully registered', Add));
        }
    })
}

exports.loginUser = (req, res) => {
    var newUser = req.body;
    userModel.findOne({ email: req.body.email }, (err, data) => {
        if (err) {
            res.json(commonFunction.sendResponse(500, 'Error on the server in finding email', err));
            console.log(err);
        } else if (!data) {
            res.json(commonFunction.sendResponse(404, 'wrong email', data));
            console.log(data);
        } else {
            var password = bcrypt.compareSync(req.body.password, data.password);
            if (!password) {
                res.json(commonFunction.sendResponse(404, 'wrong password', data));
                console.log(data);
            } else {
                var newToken = Math.random().toString(36).replace('0.', '');
                userModel.findOneAndUpdate({ email: req.body.email }, {
                    $set: { token: newToken }
                }, { upsert: true }, (err, data1) => {
                    if (err) {
                        res.status(500).send('Error on the server while creating token');
                        console.log(err);
                    } else {
                        console.log("d1" + data1);

                        userModel.findOne({ email: req.body.email }, { password: 0 }, (err, data2) => {
                            if (err) {
                                res.status(500).send('Error on the server while fetching user details');
                                console.log(err);
                            } else {
                                console.log("d2" + data2);

                                if (data2.userType == 'customer') {
                                    serviceRequestModel.find({ customerId: data2._id }).populate('serviceId').exec((err, data3) => {
                                        console.log("d3" + data3);
                                        if (err) {
                                            res.status(500).send('Error on the server while fetching service request details');
                                            console.log(err);
                                        } else {
                                            var arr = [];
                                            var objRes = {
                                                key: 'customerDetails',
                                                value: data2
                                            }
                                            console.log(objRes);
                                            var objRes1 = {
                                                key: 'ServiceRequest',
                                                value: data3
                                            }
                                            console.log(objRes1);
                                            arr.push(objRes);
                                            arr.push(objRes1);
                                            res.json(commonFunction.sendResponse(200, 'Token created', arr));
                                        }
                                    });
                                } else if (data2.userType == 'serviceProvider') {
                                    console.log("Data2" + data2);
                                    var str = [];
                                    var str1 = [];
                                    var objRes = {
                                        key: 'customerDetails',
                                        value: data2
                                    }
                                    str.push(objRes);
                                    serviceModel.find({ serviceProviderId: data2._id }, { _id: 1 }, function (err, data4) {
                                        serviceRequestModel.find({ serviceId: { $in: data4 } }).populate('serviceId').exec((err, data5) => {

                                            if (err) {
                                                res.status(200).send('Error on the server while fetchinf service request');
                                            } else {
                                                var objRes1 = {
                                                    key: 'serviceRequest',
                                                    value: data5
                                                }
                                                str.push(objRes1);
                                                res.send(commonFunction.sendResponse(200, 'Token created ', str));
                                            }

                                        });

                                    });
                                } else {
                                    res.status(404).send('Error on the server while finding usertype');
                                }

                            }
                        });
                    }
                });
            }
        }
    });


}

exports.logoutUser = (req, res) => {
    var token1 = req.headers['x-access-token'];
    if (!token1) {
        res.status(404).send('token required');
    } else {
        userModel.findOneAndUpdate({ token: token1 }, {
            $set: { token: '' }
        }, { upsert: true }, (err, data) => {
            if (err) {
                res.status(500).send('Error on the server');
                console.log(err);
            } else {
                console.log('1' + data);
                if (!data) {
                    res.json(commonFunction.sendResponse(404, 'Logout UnSuccessfull/ Already Logout ', ''));
                } else {
                    res.json(commonFunction.sendResponse(200, 'Logout Successfully', ''));
                }
            }
        });
    }
}

exports.updateUserInfo = (req, res) => {

    var token1 = req.headers['x-access-token'];
    if (!req.body.email && !req.body.userName && !req.body.oldPassword && !req.body.newPassword) {
        res.json(commonFunction.sendResponse(404, 'no data to  update', ''));
    } else {
        if (!token1) {
            res.json(commonFunction.sendResponse(404, 'token not found / not logged in', ''));
        } else {
            commonFunction.verifyToken(token1, function (data) {
                var updateInfo = {
                    emailId: data.email,
                    name: data.userName,
                    oldPswd: data.password
                };
                if (!data) {
                    res.json(commonFunction.sendResponse(404, 'token not found / not logged in', ''));
                } else {

                    if (req.body.email != undefined && req.body.email != data.email && req.body.email != '') {
                        updateInfo.emailId = req.body.email;

                    }
                    if (req.body.userName != undefined && req.body.userName != data.userName && req.body.userName != '') {
                        updateInfo.name = req.body.userName;
                    }
                    const pr = new Promise((resolve, reject) => {
                        if (req.body.oldPassword != undefined && req.body.oldPassword != '') {
                            if (req.body.newPassword != undefined && req.body.newPassword != '' && req.body.oldPassword != req.body.newPassword) {
                                resolve(true);
                            }
                            reject(new Error('msg'));
                        }
                    });
                    pr.then(result => console.log(result))
                        .then(result => {
                            var password = bcrypt.compareSync(req.body.oldPassword, data.password);
                            if (password) {
                                var hashedPassword = bcrypt.hashSync(req.body.newPassword, 8);
                                updateInfo.oldPswd = hashedPassword;
                            }
                            else {
                                res.json(commonFunction.sendResponse(404, 'old password is wrong', ''));
                            }
                        })
                        .catch(err => {
                            console.log('Error', err.message);
                            res.json(commonFunction.sendResponse(404, 'new password require /old and new pasword same/old password is wrong', ''));
                        });
                    userModel.findOneAndUpdate({ token: token1 },
                        {
                            $set:
                            {
                                userName: updateInfo.name,
                                email: updateInfo.emailId,
                                password: updateInfo.oldPswd,

                            }
                        }, function (err, data) {
                            if (err) {
                                res.json(commonFunction.sendResponse(500, 'Error on the server', err));
                                console.log(err);
                            } else {
                                console.log("B" + data);
                                res.json(commonFunction.sendResponse(200, 'User Details Updated', data));

                            }
                        }
                    );

                }
            });
        }
    }

}

exports.addComment = (req, res) => {
    var token1 = req.headers['x-access-token'];
    if (!token1 || !req.body.comment || !req.body.serviceRequestId) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    }
    else {
        commonFunction.verifyToken(token1, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                commonFunction.checkSerReqId(data, req.body.serviceRequestId, (chk, serReqData) => {
                    if (chk) {
                        if (data.userType == 'customer') {
                            if (serReqData.status == 'Accepted') {
                                var newComment = req.body;
                                var addComment = new commentModel({
                                    comment: req.body.comment,
                                    userId: data._id,
                                    serviceRequestId: req.body.serviceRequestId
                                });
                                commentModel(addComment).save((err, data) => {
                                    if (err) {
                                        res.json(commonFunction.sendResponse(500, 'Server error', err));
                                    } else {
                                        res.json(commonFunction.sendResponse(200, 'Comment Added', data));
                                    }
                                });
                            } else {
                                res.json(commonFunction.sendResponse(404, 'Comment cannot be done as request is not accepted yet', ''));
                            }

                        } else {

                            if (serReqData.status == 'Accepted') {
                                var newComment = req.body;
                                var addComment = new commentModel({
                                    comment: req.body.comment,
                                    userId: data._id,
                                    serviceRequestId: req.body.serviceRequestId
                                });
                                commentModel(addComment).save((err, data) => {
                                    if (err) {
                                        res.json(commonFunction.sendResponse(500, 'Server error', err));
                                    } else {
                                        res.json(commonFunction.sendResponse(200, 'Comment Added', data));
                                    }
                                });
                            } else {
                                res.json(commonFunction.sendResponse(404, 'Comment cannot be done as request is not accepted yet', ''));
                            }

                        }

                    } else {
                        res.json(commonFunction.sendResponse(404, 'access not allowed', ''));
                    }
                });
            }
        });
    }
}

exports.getComments = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        res.json(commonFunction.sendResponse(404, 'token not found / not logged in', ''));
    } else {
        commonFunction.verifyToken(token, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                commonFunction.checkSerReqId(data, req.body.serviceRequestId, (chk, serReqData) => {
                    if (chk) {
                        commentModel.find({ serviceRequestId: req.body.serviceRequestId }).populate().exec((err, data) => {
                            if (err) {
                                res.json(commonFunction.sendResponse(500, 'Server error', err));
                            } else {
                                res.json(commonFunction.sendResponse(200, 'Comment ', data));
                            }
                        });
                    } else {
                        res.json(commonFunction.sendResponse(404, 'access not allowed', ''));
                    }
                });
            }
        });

    }



}

exports.deleteUser = (req, res) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        commonFunction.verifyToken(token, function (data) {
            if (!data) {
                res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
            } else {
                console.log('Data1:' + data);
                if (data.userType == 'serviceProvider') {
                    serviceModel.find({ serviceProviderId: data._id }, { _id: 1 }, (err, resSerId) => {
                        if (err) {
                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                        } else {
                            console.log(resSerId);
                            serviceRequestModel.find({ serviceId: { $in: resSerId }, status: 'Accepted' }, (err, checkStatus) => {
                                if (!checkStatus.length) {
                                    serviceRequestModel.find({ serviceId: { $in: resSerId } }, { _id: 1 }, (err, reqArr) => {
                                        if (err) {
                                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                                        } else {
                                            console.log('requstArray' + reqArr);
                                            serviceRequestModel.deleteMany({ _id: { $in: reqArr } }, (err, del1) => {
                                                if (err) {
                                                    res.json(commonFunction.sendResponse(500, 'Server error', err));
                                                    console.log(err);
                                                } else {
                                                    console.log(del1);
                                                    commentModel.deleteMany({ serviceRequestId: { $in: reqArr } }, (err, del2) => {
                                                        if (err) {
                                                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                                                            console.log(err);
                                                        } else {
                                                            console.log(del2);
                                                            serviceModel.deleteMany({ serviceProviderId: data._id }, (err, del3) => {
                                                                if (err) {
                                                                    res.json(commonFunction.sendResponse(500, 'Server error', err));
                                                                    console.log(err);
                                                                } else {
                                                                    console.log(del3);
                                                                    userModel.deleteMany({ _id: data._id }, (err, del4) => {
                                                                        if (err) {
                                                                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                                                                            console.log(err);
                                                                        } else {
                                                                            console.log(del4);
                                                                            res.json(commonFunction.sendResponse(200, 'User Deleted', ''));
                                                                        }
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    });
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    console.log('b' + checkStatus);
                                    res.json(commonFunction.sendResponse(404, ' service request already accepted cannot delete user', ''));
                                }
                            })
                        }
                    });


                } else {
                    serviceRequestModel.find({ customerId: data._id, status: 'Accepted' }, (err, dataSrm) => {
                        if (dataSrm.length == 0) {
                            var arr = [];
                            console.log('a' + dataSrm);
                            serviceRequestModel.find({ customerId: data._id }, { _id: 1 }, (err, dataSerReq) => {
                                if (err) {
                                    res.json(commonFunction.sendResponse(500, 'Server error', err));
                                    console.log(err);
                                } else {
                                    console.log('data1' + dataSerReq);
                                    console.log('data1' + dataSerReq[0]);


                                    serviceRequestModel.deleteMany({ _id: { $in: dataSerReq } }, (err, delReq) => {
                                        if (err) {
                                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                                            console.log(err);
                                        } else {
                                            console.log('data2' + delReq);
                                            commentModel.deleteMany({ serviceRequestId: { $in: dataSerReq } }, (err, delCom) => {
                                                if (err) {
                                                    res.json(commonFunction.sendResponse(500, 'Server error', err));
                                                    console.log(err);
                                                } else {
                                                    console.log('data3' + delCom);
                                                    userModel.deleteOne({ _id: data._id }, (err, delUser) => {
                                                        if (err) {
                                                            res.json(commonFunction.sendResponse(500, 'Server error', err));
                                                            console.log(err);
                                                        } else {
                                                            console.log('data5' + delUser);
                                                            res.json(commonFunction.sendResponse(200, 'User Deleted', ''));
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });

                                }

                            });
                        } else {
                            console.log('b' + dataSrm);
                            res.json(commonFunction.sendResponse(404, ' service request already accepted cannot delete user', ''));
                        }

                    });


                }
            }
        });
    }
}


exports.getOneRequestDetail = (req, res) => {
    var token = req.headers['x-access-token'];

    if (!token || !req.body.serviceRequestId) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        commonFunction.verifyToken(token, function (data) {

            if (!data) {
                res.json(commonFunction.sendResponse(200, 'token not valid / not logged in', ''));
            } else {

                console.log('Data1:' + data);
                commonFunction.checkSerReqId(data, req.body.serviceRequestId, function (chk, serReqData) {
                    console.log('p' + chk);
                    if (chk) {
                        if (data.userType == 'customer') {
                            serviceRequestModel.find({ _id: req.body.serviceRequestId }).populate('serviceId').exec((err, dataReq) => {
                                console.log('Data2:' + dataReq);
                                if (err) {
                                    res.json(commonFunction.sendResponse(500, 'Error', ''));
                                } else {
                                    res.json(commonFunction.sendResponse(200, 'Request Found:', dataReq));
                                }
                            });
                        } else {
                            serviceRequestModel.find({ _id: req.body.serviceRequestId }).populate('serviceId').exec((err, dataReq) => {
                                console.log('Data3:' + dataReq);
                                if (err) {
                                    res.json(commonFunction.sendResponse(500, 'Error', ''));
                                } else {
                                    res.json(commonFunction.sendResponse(200, 'Request Found:', dataReq));
                                }
                            });

                        }
                    } else {
                        console.log('p1' + chk);
                        res.json(commonFunction.sendResponse(404, 'Access not allowed', ''));
                    }
                });
            }
        });
    }
}

exports.getAllServiceRequest = (req, res) => {
    var token = req.headers['x-access-token'];
    var sort = req.headers['sort-by'];
    if (!token) {
        res.json(commonFunction.sendResponse(404, 'all fields are required', ''));
    } else {
        if (!sort) {
            commonFunction.verifyToken(token, function (data1) {
                if (!data1) {
                    res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
                } else {
                    if (data1.userType == 'customer') {


                        serviceRequestModel.find({ customerId: data1._id }).populate('serviceId').exec((err, dataReq) => {
                            console.log('Data2:' + dataReq);
                            if (err) {
                                res.json(commonFunction.sendResponse(500, 'Error', ''));
                            } else {
                                res.json(commonFunction.sendResponse(200, 'Request Found:', dataReq));
                            }
                        });
                    } else {

                        console.log("Data2" + data1);
                        var ar = [];

                        var str = [];
                        var objRes = {
                            key: 'customerDetails',
                            value: data1
                        }
                        str.push(objRes);
                        var str1 = [];
                        serviceModel.find({ serviceProviderId: data1._id }, { _id: 1 },
                            (err, data4) => {
                                serviceRequestModel.find({ serviceId: { $in: data4 } }).populate('customerId').populate('serviceId').then(data5 => {
                                    if (err) {
                                        res.json(commonFunction.sendResponse(500, ' Server Error', ''));
                                    } else {
                                        var objRes1 = {
                                            key: 'ServiceRequest',
                                            value: data5
                                        }
                                        str.push(objRes1);
                                        res.send(commonFunction.sendResponse(200, 'Request found:', str));
                                    }

                                });
                            });
                    }
                }
            });
        } else {
            var ans = commonFunction.verifyToken(token, function (data1) {
                console.log("GOOGLE", data1);
                for (var a = 0; a < data1.length; a++) {
                    console.log("DATA", data1._id)
                }
                if (!data1) {
                    res.json(commonFunction.sendResponse(404, 'token not valid / not logged in', ''));
                } else {
                    //console.log('Data1:' + data);
                    if (data1.userType == 'customer') {


                        serviceRequestModel.find({ customerId: data1._id, status: sort }).populate('serviceId').exec((err, dataReq) => {
                            console.log('Data2:' + dataReq);
                            if (err) {
                                res.json(commonFunction.sendResponse(500, 'Error', ''));
                            } else {
                                res.json(commonFunction.sendResponse(200, 'Request Found:', dataReq));
                            }
                        });
                    } else {

                        console.log("Data2" + data1);
                        var ar = [];

                        var str = [];
                        str.push(data1);

                        serviceModel.find({ serviceProviderId: data1._id }, { _id: 1 },
                            function (err, data4) {
                                if (err) {
                                    res.json(commonFunction.sendResponse(500, 'Error', ''));
                                } else {
                                    serviceRequestModel.find({ serviceId: data4, status: sort }).populate('customerId').populate('serviceId').then(data5 => {
                                        //await console.log("serReqM:" + data5);
                                        str.push(data5);
                                        res.send(commonFunction.sendResponse(200, 'Request Found:', str));
                                    });
                                }
                            });
                    }

                }
            });
        }
    }

}