const nodemailer = require('nodemailer');
// const {promisify} = require('util');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: 'Jonas Schmedtmann <hello@jonas.io>',
    to: options.receiverMail,
    subject: options.subject,
    text: options.message,
    // html: '<p>This is an HTML email sent from Node.js</p>',
  };
  console.log("sending email ....")
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
