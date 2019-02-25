var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('check');
});

var commonUser = require('../Controller/commonUserController');
var customer = require('../Controller/customerController');
var serviceProvider = require('../Controller/serviceProviderController');

router.post('/registerUser', commonUser.registerUserDetails);
router.post('/loginUser', commonUser.loginUser);
router.put('/logoutUser', commonUser.logoutUser);
router.put('/updateUserInfo', commonUser.updateUserInfo);
router.delete('/deleteUser', commonUser.deleteUser);

router.post('/addComment', commonUser.addComment);
router.post('/getComments', commonUser.getComments);

router.post('/addService', serviceProvider.addService);
router.put('/updateService', serviceProvider.updateService);
router.delete('/deleteService', serviceProvider.deleteService);
router.get('/serviceList', serviceProvider.getServiceList);

router.put('/changeStatus', serviceProvider.changeStatus);

router.post('/createRequest', customer.createRequest);
router.delete('/deleteRequest', customer.deleteRequest);

router.post('/getOneRequestDetail', commonUser.getOneRequestDetail);
router.get('/getAllServiceRequest', commonUser.getAllServiceRequest);

module.exports = router;