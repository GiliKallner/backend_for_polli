/*import {server, email } from './config';
import nodemailer from "nodemailer";

const smtpTransport = nodemailer.createTransport({
    host: server.host,
    port: server.port,
    secure: false, // use TLS
    auth: {
        user: email.username,
        pass: email.password
    }
//    tls: {
        // do not fail on invalid certs
  //      rejectUnauthorized: false
    //}
});

const mailHeader = ( token, purpose ) => ({
               textLink : 'http://' + server.host + ':' + server.port + '/' + purpose + '/' + token,
               from : `Pyrite Team<${email.username}>`,
});


const mailBodyVerification = ({ textLink }) =>(
    `<div>
        <p> Thanks for Registering </p>
        <p> Please verify your email by clicking on the verification link below. <br/>
        <a href= { textLink.toString() } >Verification Link</a></p>
    </div>`
);


const mailBodyReset = ({ textLink }) => (
    `<div>
        <p> Please reset your password by clicking on the link below.<br/>
        <a href= { textLink.toString() } >Verification Link</a></p>
    </div>`
);

function mail( mailOptions, cb ){
    smtpTransport.sendMail(mailOptions, (err,res) =>{
        if (err) cb({'mail-error: ':err}, null);
        else cb(null, res);
        smtpTransport.close(); 
    });
}

exports.sendVerificationEmail = ( token, username, cb ) => {
    
    let head = mailHeader(token, 'verificationEmail');
    let body = mailBodyReset( head );
    mail({  from: head.from, 
            to: username, 
            subject: `Account New password`, 
            html: body  
            }, cb);
};
*/