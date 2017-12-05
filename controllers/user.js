var express = require('express');
var moment = require ('moment');
var async = require('async');
var passwordHasher = require('aspnet-identity-pw');
var router = express.Router() ;
var User   = require('../models/user');
var ListProvince   = require('../models/listprovince');
var DayUtil   = require('../helpers/dayutil');
var UserAuth   = require('../models/userauth');
var jwt = require('jsonwebtoken');
var config = require('../config'); // get our config file
var secretKey = config.secret;
var Helpers = require('./helpers');







// router.get('/checkauth', function(req, res, next) {
//     var data = {
//         title: 'Game guide',
//         description: 'Page Description',
//         header: 'Page Header'
//     };
//     res.render("user/checkauth", data);
// })

router.post('/checktoken', function(req, res, next) {
    UserAuth.CheckToken(req.body.token,function(result){
        res.json(result);
    })
})

router.get('/logout', Helpers.isAuthenticated, function(req, res, next) {
    User.GetUserByID(req.decoded._doc._id,function(result){
        var token = "";
        if(result.status){
            token = jwt.sign( result.user, secretKey, { 
                expiresIn : 0 // expires in 24 hours
            });
        }
        res.cookie('x-access-token', token, { expires: new Date(Date.now())});
        res.redirect("/");
    })    
})

router.get('/', function(req, res, next) {

    res.redirect("/user/index");
})

router.get('/index', Helpers.isAuthenticated, function(req, res, next) {
    var data = {
        title : "user home page",
    };
    res.render("user/index", data);
})

router.get('/changepass', Helpers.isAuthenticated, function(req, res, next) {
    var data = {
        title : "user home page",
    };
    res.render("user/index", data);
})

router.post('/changepass', Helpers.isAuthenticated, function(req, res, next) {
    if(!req.body.OldPassword){
        res.json({status: false, mes: 'Please enter Old Password'});
    }else if(!req.body.NewPassword){
        res.json({status: false, mes: 'Please enter New Password'});
    }else if(req.body.NewPassword != req.body.ConfirmPassword){
        res.json({status: false, mes: 'Password confirm is not match'});
    }else{
        User.GetUserByID(req.decoded._doc._id,function(result){
            if(!passwordHasher.validatePassword(req.body.OldPassword, result.user.password)){
                res.json({status: false, mes: 'Old Password is not correct'});
            }else{
                var query = {
                    _id : result.user.id,
                };
                var setField = {$set: { password: passwordHasher.hashPassword(req.body.NewPassword)}};
                User.update(query, setField, {upsert: true}, function(err, up){
                    res.json({status: true, mes: 'Change password successfully'});
                })
            }
        })  
        
    }
})

router.get('/getuserinfo', Helpers.isAuthenticated, function(req, res, next) {
    // console.log("token", req.decoded._doc);
    
    User.GetUserByID(req.decoded._doc._id, function(result){
        // console.log("kq", result);
        Helpers.RequestBalance(result.user);
        result.user.password = '';
        res.json(result.user);
    })
})

router.post('/autocomplete', function(req, res, next) {
    User.AutoComplete(req.body.q, function(result){
        res.json(result);

    });

})

router.get('/createaccount', function(req, res, next) {
    var data = {
        title: 'Game guide',
        description: 'Page Description',
        header: 'Page Header'
    };
    res.render("layout/adminlayout", data);
})

router.post('/createaccount', function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    UserAuth.CheckToken(token,function(result){
        //console.log(result);
        if(result.status == true){
            var user = {
                username: req.body.username,
                fullname: req.body.fullname,
                phone: req.body.phone,
                sponsor: result.decoded._doc.username,
                email : req.body.email,
                password : req.body.password,
                datecreate : new Date()
            };
            var role = ["member"];
            if(req.body.createaccount == "on"){
                role.push("create account");
            }
            User.addUser(user, role, function(result){
                res.json(result);
            });
        }
    })

})

router.get('/downline', function(req, res, next) {
    var data = {
        title: 'Down line',
        description: 'Page Description',
        header: 'Down line'
    };
    res.render("user/downline", data);
})



module.exports = router