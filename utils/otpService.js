const nodemailer = require('nodemailer');

const otpStore = {};

// Configure transporter (don't hardcode in production)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'joseph.belhadj@gmail.com',
        pass: 'govd wuqj vxeg rprn',
    },
});

// Generate and send OTP
exports.sendOtp = (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    const mailOptions = {
        from: 'joseph.belhadj@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) console.error(error);
    });

    setTimeout(() => {
        delete otpStore[email];
    }, 5 * 60 * 1000);

    return otp;
};

// Verify OTP
exports.verifyOtp = (email, otp) => {
    return otpStore[email] && otpStore[email] === parseInt(otp, 10);
};
