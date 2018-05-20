import express from 'express';
import config from '../config';
import jwt from 'jsonwebtoken';

import { User } from '../models/user';

let router = express.Router();

router.post('/', (req, res) => {
    
    const { identifier, password } = req.body;
    
        User.findUser( identifier, identifier )
        .then(user => {
            let credential_error = new Error();
            credential_error.statusCode = 401;
            credential_error.message = 'Invalid Credentials';
            
            if(!user) 
                return res.status(401).json( { error: 'Invalid Credentials' } );
            
            user.comparePasswords(password, match => {
                if(!match) return res.status(401).json( { error: 'Invalid Credentials' } );
                
                const token = jwt.sign({
                        id: user._id,
                        username: user.username
                        },config.jwtSecret);
                        
                res.json(token);                            
                }, err => res.status(500).json({errors: 'internal problem with saving the user: ',err})
            );
        }); 
});

export default router;