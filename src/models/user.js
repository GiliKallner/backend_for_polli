const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const argon2 = require('argon2'),
      uniqueValidator = require('mongoose-unique-validator');

const user = new Schema({
        username: { type:String, unique: true, required: true},
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true }
    });
    
user.pre('save', function( next ) {
        
        if (!this.isModified('password')) return next();

        argon2.hash( this.password )
        .then( hash => {
                if ( hash ) {
                        this.password = hash;
                        next();
                }
                else return next(new Error('unable to hash the password'));
        });
});

user.pre('update', function( next ) {
        const password = this.getUpdate().$set.password;
        if (!password) return next();
        
        argon2.hash( password )
        .then( hash=>{
                if ( hash ) {
                        this.password = hash;
                        next();
                }
                else return next(new Error('unable to hash the password'));
        });
});

user.methods.comparePasswords = function(candidatePassword, callback) {
        argon2.verify(this.password, candidatePassword)
                .then(callback)
};

user.plugin(uniqueValidator);


user.statics = {
        
        findUser : function ( name, email ) {
                return this.findOne({ $or:[ {'username':name }, {'email':email } ]});
        },
        findUserByIdentifier : function(identifer, value ) {
                let query = {}; 
                query [identifer] = { '$eq': value };
                return this.findOne( query );
        },
        saveNewUser: function ( user, callback ) {
                const { username, email, password } = user;
                this.create( { username : username, email : email, password : password }
                ,(err, user) => {
                        if(err) return callback(err, null);
                        user.save(callback)});
        }
    
};

export const User =  mongoose.model('User', user);

