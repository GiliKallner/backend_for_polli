'use strict';

Object.defineProperty(exports, "__esModule", {
        value: true
});
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var argon2 = require('argon2'),
    uniqueValidator = require('mongoose-unique-validator');

var user = new Schema({
        username: { type: String, unique: true, required: true },
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true }
});

user.pre('save', function (next) {
        var _this = this;

        if (!this.isModified('password')) return next();

        argon2.hash(this.password).then(function (hash) {
                if (hash) {
                        _this.password = hash;
                        next();
                } else return next(new Error('unable to hash the password'));
        });
});

user.pre('update', function (next) {
        var _this2 = this;

        var password = this.getUpdate().$set.password;
        if (!password) return next();

        argon2.hash(password).then(function (hash) {
                if (hash) {
                        _this2.password = hash;
                        next();
                } else return next(new Error('unable to hash the password'));
        });
});

user.methods.comparePasswords = function (candidatePassword, callback) {
        argon2.verify(this.password, candidatePassword).then(callback);
};

user.plugin(uniqueValidator);

user.statics = {

        findUser: function findUser(name, email) {
                return this.find({ $or: [{ 'username': name }, { 'email': email }] });
        },

        saveNewUser: function saveNewUser(user, callback) {
                var username = user.username,
                    email = user.email,
                    password = user.password;

                this.create({ username: username, email: email, password: password }, function (err, user) {
                        if (err) return callback(err, null);
                        user.save(callback);
                });
        }

};

var User = exports.User = mongoose.model('User', user);