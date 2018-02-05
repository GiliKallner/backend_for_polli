'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _user = require('../models/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.post('/', function (req, res) {
    var _req$body = req.body,
        identifier = _req$body.identifier,
        password = _req$body.password;


    _user.User.findUser(identifier, identifier).then(function (users) {
        if (!users.length) return res.status(401).json({ errors: { form: 'Invalid Credentials' } });

        var user = users[0];
        user.comparePasswords(password, function (match) {

            if (!match) return res.status(401).json({ errors: 'Invalid Credentials' });

            var token = _jsonwebtoken2.default.sign({
                id: user._id,
                username: user.username
            }, _config2.default.jwtSecret);

            res.json(token);
        }, function (err) {
            return res.status(500).json({ errors: 'internal problem with saving the user: ', err: err });
        });
    });
});

exports.default = router;