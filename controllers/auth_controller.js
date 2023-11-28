require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
var jwt = require("jsonwebtoken");
const { ResponseTemplate } = require("../helper/template_helper");
const nodemailer = require("nodemailer");
const { format, parseISO } = require("date-fns");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.EMAIL_SMTP,
    pass: process.env.PASS_SMTP,
  },
});

async function register(req, res, next) {
  try {
    let { name, email, password, age, birthdate } = req.body;

    const formattedDate = parseISO(format(new Date(birthdate), "yyyy-MM-dd"));
    formattedDate.setDate(formattedDate.getDate() + 1);
    const newformattedDate = formattedDate.toISOString();

    let existUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existUser) {
      let resp = ResponseTemplate(null, "User already exist", null, 400);
      // res.redirect("/auth/register");
      res.json(resp);
      return;
    }
    let encriptedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: encriptedPassword,
        age: parseInt(age),
        birthdate: newformattedDate,
        profile_picture: "default.jpg",
        is_verified: false,
      },
      select: {
        id: false,
        name: true,
        email: true,
        age: true,
        birthdate: true,
        profile_picture: true,
        is_verified: true,
      },
    });
    // Pengguna berhasil diautentikasi, generate token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload token
      process.env.SECRET_KEY // Rahasia untuk menandatangani token (gantilah dengan rahasia yang kuat)
      // { expiresIn: "1h" } // Opsional: Waktu kedaluwarsa token
    );

    const baseURL = process.env.BASE_URL;
    const verificationLink = `${baseURL}/auth/verify?token=${token}`;

    const mailOptions = await transporter.sendMail({
      from: process.env.EMAIL_SMTP, // sender address
      to: email, // list of receivers
      subject: "Verification Email", // Subject line
      text: "Hello world?", // plain text body
      html: `<a href="${verificationLink}">Verify your email</a>`, // html body
    });
    console.log("Email sent: " + mailOptions.response);
    let resp = ResponseTemplate(user, "create successfully", null, 200);
    // res.redirect("/auth/login");
    res.json(resp);
    return;
  } catch (error) {
    next(error);
  }
}

async function authUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      let resp = ResponseTemplate(
        null,
        "Incorrect email or password",
        null,
        401
      );
      res.json(resp);
      return;
    } else if (!user.is_verified) {
      let resp = ResponseTemplate(
        null,
        "Please verify your email first",
        null,
        401
      );
      res.json(resp);
      return;
    } else {
      // Pengguna berhasil diautentikasi, generate token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email }, // Payload token
        process.env.SECRET_KEY // Rahasia untuk menandatangani token (gantilah dengan rahasia yang kuat)
        // { expiresIn: "1h" } // Opsional: Waktu kedaluwarsa token
      );
      let resp = ResponseTemplate({ token }, "login success", false, 200);
      res.json(resp);
      return;
    }
  } catch (error) {
    let resp = ResponseTemplate(false, "Internal Server Error", false, 500);
    // Sentry.captureException(error);
    res.json(resp);
    return;
  }
}

async function verify(req, res, next) {
  try {
    const verificationToken = req.query.token;

    // Lakukan validasi token dan verifikasi pengguna di sini
    jwt.verify(
      verificationToken,
      process.env.SECRET_KEY,
      async (err, decoded) => {
        if (err) {
          let resp = ResponseTemplate(false, "invalid token", null, 401);
          return res.json(resp);
        }

        // Verifikasi pengguna dengan token
        const updatedUser = await prisma.user.update({
          where: { email: decoded.email }, // Gunakan decoded.email untuk mendapatkan email dari token
          data: { is_verified: true },
          select: {
            id: false,
            name: true,
            email: true,
            age: true,
            birthdate: true,
            profile_picture: true,
            is_verified: true,
          },
        });

        let resp = ResponseTemplate(
          updatedUser,
          "Account verified successfully",
          null,
          200
        );
        res.json(resp);
      }
    );
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      let resp = ResponseTemplate(null, "User not found", null, 404);
      res.json(resp);
      return;
    } else if (!user.is_verified) {
      let resp = ResponseTemplate(
        null,
        "Please verify your email first",
        null,
        401
      );
      res.json(resp);
      return;
    }

    // Generate token untuk reset password
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, action: "reset-password" },
      process.env.SECRET_KEY,
      { expiresIn: "1h" } // Token reset password berlaku selama 1 jam
    );

    const baseURL = process.env.BASE_URL;
    // Kirim email reset password
    const resetLink = `https://challenge-chapter-7-production.up.railway.app/auth/resetPassword?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_SMTP,
      to: email,
      subject: "Reset Password",
      html: `<p>To reset your password, click on the following link:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);

    let resp = ResponseTemplate(
      null,
      "Password reset instructions sent to your email",
      null,
      200
    );
    res.json(resp);
    return;
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  const { newPassword } = req.body;
  const token = req.query.token;

  try {
    // Verifikasi token reset password
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    // Cek apakah token sesuai dengan aksi reset password
    if (decodedToken.action !== "reset-password") {
      let resp = ResponseTemplate(null, "Invalid token", null, 401);
      res.json(resp);
      return;
    }

    // Reset password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decodedToken.id },
      data: {
        password: encryptedPassword,
      },
    });

    let resp = ResponseTemplate(null, "Password reset successfully", null, 200);
    res.json(resp);
    return;
  } catch (error) {
    next(error);
  }
}

module.exports = { register, authUser, verify, forgotPassword, resetPassword };
