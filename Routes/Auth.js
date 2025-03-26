const express = require('express');
const Router = express.Router();
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const SecretKey = process.env.SECURITY_KEY;
const { sendOtpEmail } = require('./Nodemailer'); 


const otpStorage = {}; 

Router.post('/signUp', async (req, res) => {
  try {
    const userCollections = getDb('profiles');
    const { email, password, userName} = req.body;

    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid Email' });

    const user = await userCollections.findOne({ email });
    if (user) return res.status(400).send('Email Already Exists !!! Try Logging In');
    const user2=await userCollections.findOne({userName});
    if(user2) return res.status(400).send('UserName Already Exists !!! Please try a new username');

    const hashedPassword = await bcrypt.hash(password, 12);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = { otp, password: hashedPassword};

    await sendOtpEmail(email, otp);

    res.status(200).json({msg:'OTP has been sent to your email. Please verify to proceed.'});
  } catch (error) {
    console.log(error);

    res.status(500).json({'errror':error});
  }
});

Router.post('/verifyOTP', async (req, res) => {
  try {
    const { email, otp, signUp } = req.body;

    if (!otpStorage[email] || otpStorage[email].otp !== otp) {
      return res.status(400).send('Invalid or Expired OTP');
    }

    if (signUp) {
      const {userName}=req.body;
      const { password} = otpStorage[email];
      const userCollections = getDb('profiles');
      await userCollections.insertOne({ email, password, userName });
    }

    const user = await getDb('profiles').findOne({email:email});
    
    const payload = { email };
    const token = jwt.sign(payload, SecretKey, { expiresIn: '1h' });
    
    res.cookie('authToken', token, {
      httpOnly: false,
      secure: true, 
      sameSite: 'None', 
      path:'/',
      maxAge: 3600000 
    });
    res.cookie('email', email, {
      httpOnly: false,
      secure: true, 
      sameSite: 'None', 
      path:'/',
      maxAge: 3600000 
    });
    
    res.cookie('userName', user.userName, {
      httpOnly: false,
      secure: true, 
      sameSite: 'None', 
      path:'/',
      maxAge: 3600000 
    });
    
    console.log("AuthToken : ",token);
    
    
    delete otpStorage[email];
    console.log({ message: signUp ? 'OTP Verified! User Registered Successfully.' : 'OTP Verified! Login Successful.', Token: token,userName:user.userName })
    console.log(user);

    return res.json({ message: signUp ? 'OTP Verified! User Registered Successfully.' : 'OTP Verified! Login Successful.', Token: token });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

Router.post('/logIn', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCollections = getDb('profiles');

    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid Email' });

    const user = await userCollections.findOne({ email });
    if (!user) return res.status(400).send('User not Found !!! ');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).send('Password is Incorrect !!! ');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = { otp };

    await sendOtpEmail(email, otp);

    res.status(200).json({msg:'OTP has been sent to your email. Please verify to proceed.'});
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = Router;
