
import jose from 'node-jose';
import argon2 from 'argon2';
import toPem from 'jwk-to-pem';

//import { salt } from './config'
import { User } from './models/user';

const keystore = jose.JWK.createKeyStore();

const promises = [keystore.generate('EC', 'P-256', { kid: '1' }), keystore.generate('RSA', 2048, { kid: '2' })];

/* ********************************************************************************** */

export const signJwt = ({ username, _id }) => {
    const signingKey = keystore.get('1');

    const opts = {
        algorithm: 'ES256',
        exp: Date.now() + 1000,
        handlers: {
            "exp": true
        }
    };

    const payload = {
        username: username,
        id: _id,
        admin: true,
        use: 'sig',
        alg: 'A128GCM'
    };

    return new Promise(res => {
        jose.JWS.createSign(opts, signingKey).update(JSON.stringify(payload)).final().then(x => res(x));
    });
};

/* ********************************************************************************** */

const signAndEncryptJwt = user => {

    const encryptionKey = keystore.get('2');
    const ecryptionOptions = {
        format: 'compact',
        contentAlg: 'A128CBC-HS256'
    };

    const promise = new Promise((resolve, reject) => {

        signJwt(user).then(signedJwt => {
            const encrypt = jose.JWE.createEncrypt(ecryptionOptions, encryptionKey).update(JSON.stringify(signedJwt)).final();
            resolve(encrypt);
        }, err => {
            console.error('Signing error: ', err);reject(err);
        });
    });

    return promise;
};

/* ********************************************************************************** */

export const saveNewUser = user => {

    const { username, email, password } = user;

    const promise = new Promise((res, rej) => {

        const create_password = argon2.hash(password);
        create_password.then(pass => {

            let user = {
                'username': username,
                'email': email,
                'password': pass
            };

            new User(user).save((err, user) => {
                if (err) return rej(err);
                res(user);
            });
        });
    });
    return promise;
};

/* ********************************************************************************** */

const generateKeys = () => {
    const keys = {
        signingKey: keystore.get('1'),
        encryptionKey: keystore.get('2')
    };

    let keysInPem = {};
    Object.keys(keys).forEach(key => {
        keysInPem[key] = {
            publicKey: toPem(keys[key].toJSON()),
            privateKey: toPem(keys[key].toJSON(true), { 'private': true })
        };
    });

    return {
        clientKeys: [keysInPem.encryptionKey.privateKey, keysInPem.signingKey.publicKey],
        dbKeys: [keysInPem.encryptionKey.publicKey, keysInPem.signingKey.privateKey]
    };
};

/* ********************************************************************************** */

export const saveUser = (user, update) => {

    const promise = new Promise((resolve, reject) => {

        Promise.all(promises).then(() => {
            const { clientKeys, dbKeys } = generateKeys();
            saveNewUser(user, dbKeys, update).then(user => signAndEncryptJwt(user)).then(finalJose => resolve({
                keys: clientKeys,
                token: finalJose
            }), error => {
                console.error('error ocured during signing/encrition process: ', error);reject(error);
            });
        }, error => {
            console.error('error ocured during creating keys: ', error);reject(error);
        });
    }).catch(error => {
        console.error('error ocured during creating keys or other: ', error);
    });

    return promise;
};

/* ********************************************************************************** */

const decrepteAndValidate = (jwt, [public_siginig_key, encrypt_private_key]) => {

    const promise = new Promise((resolve, reject) => {

        const decrypt_jwt = jose.JWE.createDecrypt(encrypt_private_key).decrypt(jwt);

        decrypt_jwt.then(decrypted => {

            let unVerified = JSON.parse(decrypted.payload);

            jose.JWS.createVerify(public_siginig_key).verify(unVerified).then(result => {
                resolve(JSON.parse(result.payload));
            }, err => reject(err));
        });
    });

    return promise;
};

/* ********************************************************************************** */

const validateTokens = (keys, token) => {
    const [encryptionKey, signingKey] = keys;

    const promises = [jose.JWK.asKey(signingKey, "pem"), jose.JWK.asKey(encryptionKey, "pem")];

    Promise.all(promises).then(keys => {
        decrepteAndValidate(token, keys).then(result => console.log('result: ', result)).catch(err => console.error('result parsing error: ', err));
    }, err => console.error('error in creating keys from credentials: ', err));
};
//# sourceMappingURL=utils.js.map