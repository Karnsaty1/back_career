require('dotenv').config();
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: false,  
  tls: {
    rejectUnauthorized: false  
  }
});



const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, 
    to: email,                   
    subject: 'Your OTP Code',    
    text: `Your OTP code is ${otp}. It is valid for 10 minutes.`, 
  };

  try {
   
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendOtpEmail };
