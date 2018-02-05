'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.saveUser = exports.saveNewUser = exports.signJwt = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

//import { salt } from './config'


var _nodeJose = require('node-jose');

var _nodeJose2 = _interopRequireDefault(_nodeJose);

var _argon = require('argon2');

var _argon2 = _interopRequireDefault(_argon);

var _jwkToPem = require('jwk-to-pem');

var _jwkToPem2 = _interopRequireDefault(_jwkToPem);

var _user = require('./models/user');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var keystore = _nodeJose2.default.JWK.createKeyStore();

var promises = [keystore.generate('EC', 'P-256', { kid: '1' }), keystore.generate('RSA', 2048, { kid: '2' })];

/* ********************************************************************************** */

var signJwt = exports.signJwt = function signJwt(_ref) {
    var username = _ref.username,
        _id = _ref._id;

    var signingKey = keystore.get('1');

    var opts = {
        algorithm: 'ES256',
        exp: Date.now() + 1000,
        handlers: {
            "exp": true
        }
    };

    var payload = {
        username: username,
        id: _id,
        admin: true,
        use: 'sig',
        alg: 'A128GCM'
    };

    return new Promise(function (res) {
        _nodeJose2.default.JWS.createSign(opts, signingKey).update(JSON.stringify(payload)).final().then(function (x) {
            return res(x);
        });
    });
};

/* ********************************************************************************** */

var signAndEncryptJwt = function signAndEncryptJwt(user) {

    var encryptionKey = keystore.get('2');
    var ecryptionOptions = {
        format: 'compact',
        contentAlg: 'A128CBC-HS256'
    };

    var promise = new Promise(function (resolve, reject) {

        signJwt(user).then(function (signedJwt) {
            var encrypt = _nodeJose2.default.JWE.createEncrypt(ecryptionOptions, encryptionKey).update(JSON.stringify(signedJwt)).final();
            resolve(encrypt);
        }, function (err) {
            console.error('Signing error: ', err);reject(err);
        });
    });

    return promise;
};

/* ********************************************************************************** */

var saveNewUser = exports.saveNewUser = function saveNewUser(user) {
    var username = user.username,
        email = user.email,
        password = user.password;


    var promise = new Promise(function (res, rej) {

        var create_password = _argon2.default.hash(password);
        create_password.then(function (pass) {

            var user = {
                'username': username,
                'email': email,
                'password': pass
            };

            new _user.User(user).save(function (err, user) {
                if (err) return rej(err);
                res(user);
            });
        });
    });
    return promise;
};

/* ********************************************************************************** */

var generateKeys = function generateKeys() {
    var keys = {
        signingKey: keystore.get('1'),
        encryptionKey: keystore.get('2')
    };

    var keysInPem = {};
    Object.keys(keys).forEach(function (key) {
        keysInPem[key] = {
            publicKey: (0, _jwkToPem2.default)(keys[key].toJSON()),
            privateKey: (0, _jwkToPem2.default)(keys[key].toJSON(true), { 'private': true })
        };
    });

    return {
        clientKeys: [keysInPem.encryptionKey.privateKey, keysInPem.signingKey.publicKey],
        dbKeys: [keysInPem.encryptionKey.publicKey, keysInPem.signingKey.privateKey]
    };
};

/* ********************************************************************************** */

var saveUser = exports.saveUser = function saveUser(user, update) {

    var promise = new Promise(function (resolve, reject) {

        Promise.all(promises).then(function () {
            var _generateKeys = generateKeys(),
                clientKeys = _generateKeys.clientKeys,
                dbKeys = _generateKeys.dbKeys;

            saveNewUser(user, dbKeys, update).then(function (user) {
                return signAndEncryptJwt(user);
            }).then(function (finalJose) {
                return resolve({
                    keys: clientKeys,
                    token: finalJose
                });
            }, function (error) {
                console.error('error ocured during signing/encrition process: ', error);reject(error);
            });
        }, function (error) {
            console.error('error ocured during creating keys: ', error);reject(error);
        });
    }).catch(function (error) {
        console.error('error ocured during creating keys or other: ', error);
    });

    return promise;
};

/* ********************************************************************************** */

var decrepteAndValidate = function decrepteAndValidate(jwt, _ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
        public_siginig_key = _ref3[0],
        encrypt_private_key = _ref3[1];

    var promise = new Promise(function (resolve, reject) {

        var decrypt_jwt = _nodeJose2.default.JWE.createDecrypt(encrypt_private_key).decrypt(jwt);

        decrypt_jwt.then(function (decrypted) {

            var unVerified = JSON.parse(decrypted.payload);

            _nodeJose2.default.JWS.createVerify(public_siginig_key).verify(unVerified).then(function (result) {
                resolve(JSON.parse(result.payload));
            }, function (err) {
                return reject(err);
            });
        });
    });

    return promise;
};

/* ********************************************************************************** */

var validateTokens = function validateTokens(keys, token) {
    var _keys = _slicedToArray(keys, 2),
        encryptionKey = _keys[0],
        signingKey = _keys[1];

    var promises = [_nodeJose2.default.JWK.asKey(signingKey, "pem"), _nodeJose2.default.JWK.asKey(encryptionKey, "pem")];

    Promise.all(promises).then(function (keys) {
        decrepteAndValidate(token, keys).then(function (result) {
            return console.log('result: ', result);
        }).catch(function (err) {
            return console.error('result parsing error: ', err);
        });
    }, function (err) {
        return console.error('error in creating keys from credentials: ', err);
    });
};