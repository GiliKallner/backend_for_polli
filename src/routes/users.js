import express  from 'express';
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
        
       Object.keys(data).forEach((item) => {
           if(isEmpty(data[item])){
              errors[item] = "This field is required";
           }
       });
       
       if(!Validator.isEmail(data.email)) {
         errors.email = 'Invalid Email address';
       }
      
      if(!Validator.equals(data.password,data.psConfirm)) {
        errors.psConfirm = 'Passwords must match';
      }
        
      return {
        errors,
        isValid: isEmpty(errors)
      }
}

function validateInput( data, otherValidations ) {

    let { errors } = otherValidations( data );
    const { username, email } = data;
    
    return User.findUser( username, email )
            .then( user => {
                    const message = o => `There is already a member with that ${o}.`;
                    if(user){
                        if (user.name === username) errors.username = message('username');
                        if (user.email === email) errors.email = message('email address');
                    }
                }).then(()=>{
                    return { errors,
                             isValid: isEmpty(errors)
                            };
                }).catch(err=>{
                    console.error('no user was found in our data base: ',err);
            });

}

router.get('/',(req,res) => {
    const name  = Object.keys(req.query), identifier = req.query[name];
    let response = {};
    User.findUserByIdentifier( name, identifier )
    .then(  user => {
            if(user) { 
                    response[ name ] = `There is already a member with that ${name}.`;
                    return res.json( response );
            }
            response[name] = '';
            res.json( response );
        }, 
        err => console.log('err: ',err)
    );
});

router.post('/',(req,res) => {
    validateInput(req.body,otherValidations)
        .then(({ errors, isValid }) => {

            if(isValid) {
                User.saveNewUser( req.body, 
                    ( err,user ) => {
                
                        if(err) { 
                            let error = new Error();
                            error.statusCode = err.statusCode;
                            return res.status(error.statusCode).json(error);
                        }
                        const token = jwt.sign({
                                        id: user._id,
                                        username: user.username
                                        },config.jwtSecret);
                        res.json(token);
                    }, 
                    err=> res.status(500).json('Data base error: ',err) 
                );
            }
            else res.status(401).json(errors);
    });
    
});

export default router;