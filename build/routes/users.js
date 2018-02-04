import express from 'express';
import { isEmpty } from 'lodash';
import Validator from 'validator';

//import { sendVerificationEmail } from '../mail';
const argon2 = require('argon2');

import crypto from 'crypto';
import { saveNewUser } from '../utils';
import config from '../config';
import jwt from 'jsonwebtoken';

let router = express.Router();

import { User } from '../models/user';
//User.find().remove(function(){console.log("removed")});


function otherValidations(data) {

    let errors = {};

    Object.keys(data).forEach(item => {
        if (isEmpty(data[item])) {
            errors[item] = "This field is required";
        }
    });

    if (!Validator.isEmail(data.email)) {
        errors.email = 'Invalid Email address';
    }

    if (!Validator.equals(data.password, data.psConfirm)) {
        errors.psConfirm = 'Passwords must match';
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
}

function validateInput(data, otherValidations) {

    let { errors } = otherValidations(data);
    const { username, email } = data;

    return User.findUser(username, email).then(users => {
        let user = users[0];
        if (user) {
            if (user.name === username) errors.username = "This username already exists.";
            if (user.email === email) errors.email = "This email already exists.";
        }
    }).then(() => {
        return { errors,
            isValid: isEmpty(errors)
        };
    }).catch(err => {
        console.error(err);
        console.log('no user was found in our data base.');
    });
}

router.get('/:identifier', (req, res) => {
    const { identifier } = req.params;
    User.findUser(identifier, identifier).then(users => res.json(users[0]), err => res.status(401).json('no user found: ', err));
});

router.get('/', () => {
    console.log('kjhkjhkh');
});
router.post('/', (req, res) => {
    validateInput(req.body, otherValidations).then(({ errors, isValid }) => {

        if (isValid) {
            User.saveNewUser(req.body, (err, user) => {

                if (err) {
                    let error = new Error();
                    error.statusCode = err.statusCode;
                    return res.status(error.statusCode).json(error);
                }

                const token = jwt.sign({
                    id: user._id,
                    username: user.username
                }, config.jwtSecret);
                res.json(token);
            }, err => {
                res.status(401).json('invalid credentials');
            });
        } else {
            res.status(400).json(errors);
        }
    });
});

export default router;