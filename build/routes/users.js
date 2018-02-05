'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _lodash = require('lodash');

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _utils = require('../utils');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _user = require('../models/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import { sendVerificationEmail } from '../mail';
var argon2 = require('argon2');

var router = _express2.default.Router();

//User.find().remove(function(){console.log("removed")});


function otherValidations(data) {

    var errors = {};

    Object.keys(data).forEach(function (item) {
        if ((0, _lodash.isEmpty)(data[item])) {
            errors[item] = "This field is required";
        }
    });

    if (!_validator2.default.isEmail(data.email)) {
        errors.email = 'Invalid Email address';
    }

    if (!_validator2.default.equals(data.password, data.psConfirm)) {
        errors.psConfirm = 'Passwords must match';
    }

    return {
        errors: errors,
        isValid: (0, _lodash.isEmpty)(errors)
    };
}

function validateInput(data, otherValidations) {
    var _otherValidations = otherValidations(data),
        errors = _otherValidations.errors;

    var username = data.username,
        email = data.email;


    return _user.User.findUser(username, email).then(function (users) {
        var user = users[0];
        if (user) {
            if (user.name === username) errors.username = "This username already exists.";
            if (user.email === email) errors.email = "This email already exists.";
        }
    }).then(function () {
        return { errors: errors,
            isValid: (0, _lodash.isEmpty)(errors)
        };
    }).catch(function (err) {
        console.error(err);
        console.log('no user was found in our data base.');
    });
}

router.get('/:identifier', function (req, res) {
    var identifier = req.params.identifier;

    _user.User.findUser(identifier, identifier).then(function (users) {
        return res.json(users[0]);
    }, function (err) {
        return res.status(401).json('no user found: ', err);
    });
});

router.get('/', function () {
    console.log('kjhkjhkh');
});
router.post('/', function (req, res) {
    validateInput(req.body, otherValidations).then(function (_ref) {
        var errors = _ref.errors,
            isValid = _ref.isValid;


        if (isValid) {
            _user.User.saveNewUser(req.body, function (err, user) {

                if (err) {
                    var error = new Error();
                    error.statusCode = err.statusCode;
                    return res.status(error.statusCode).json(error);
                }

                var token = _jsonwebtoken2.default.sign({
                    id: user._id,
                    username: user.username
                }, _config2.default.jwtSecret);
                res.json(token);
            }, function (err) {
                res.status(401).json('invalid credentials');
            });
        } else {
            res.status(400).json(errors);
        }
    });
});

exports.default = router;