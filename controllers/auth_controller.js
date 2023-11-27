require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();
var jwt = require("jsonwebtoken");
const { ResponseTemplate } = require("../helper/template_helper");
const nodemailer = require("nodemailer");
// const { format } = require("date-fns"); // Gunakan library date-fns untuk konversi tanggal
const parseISO = require("date-fns/parseISO");
const format = require("date-fns/format");

async function register(req, res, next) {
  try {
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

    let { name, email, password, age, birthdate } = req.body;
    const formattedDate = new Date(parseISO(birthdate));
    formattedDate.setDate(formattedDate.getDate() + 1);
    const newformattedDate = formattedDate.toISOString();

    // console.log(parseISO(birthdate));

    let existUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existUser) {
      let resp = ResponseTemplate(null, "User already exist", null, 400);
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
    });
    // Pengguna berhasil diautentikasi, generate token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, // Payload token
      process.env.SECRET_KEY // Rahasia untuk menandatangani token (gantilah dengan rahasia yang kuat)
      // { expiresIn: "1h" } // Opsional: Waktu kedaluwarsa token
    );

    const verificationLink = `http://localhost:8080/auth/verify?token=${token}`;

    const mailOptions = await transporter.sendMail({
      from: process.env.EMAIL_SMTP, // sender address
      to: email, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: `<a href="${verificationLink}">Verify your email</a>`, // html body
    });
    console.log("Email sent: " + mailOptions.response);
    let resp = ResponseTemplate(user, "create successfully", null, 200);
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
    Sentry.captureException(error);
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

module.exports = { register, authUser, verify };
