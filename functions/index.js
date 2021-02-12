const functions = require("firebase-functions");
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});
admin.initializeApp();

/**
* Here we're using Gmail to send 
*/
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().gmail.user,
        pass: functions.config().gmail.pass
    }
});


exports.sendMail = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
      
        // getting dest email by query string
        const token0 = req.query.token0;
        const token1 = req.query.token1;
        const percent = req.query.percent;
        const price = req.query.price;
        const plusOrMinus = (percent < 0) ? '' : '+';

        const mailOptions = {
            from: 'Uniswap price alert<tbachcrypto@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
            to: 'binktogether@gmail.com',
            subject: `${token0}/${token1} is ${plusOrMinus}${percent}% from base || price ETH ${price}`, // email subject
            html: `<p style="font-size: 16px;">Pickle Rick!!</p>` // email content in HTML
        };
  
        // returning result
        return transporter.sendMail(mailOptions, (erro, info) => {
            if(erro){
                return res.send(erro.toString());
            }
            return res.send('Sended');
        });
    });    
});