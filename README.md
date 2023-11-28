# challenge-chapter-7

## Skill Metric

- Debugging and Logging
- Websocket dan Socket.io
- Mailer

## Delivery

- [x] Mengimplementasikan debugging dan logging menggunakan sentry untuk mencatat error didalam
      aplikasi
- [x] Menerapkan fitur real-time notifikasi sebagai welcome notif dan update password
- [x] MMenerapkan mailer untuk fitur lupa password

## Criteria

- [x] Mengimplementasikan Debugging & Logging (30 points)
- [x] Mengimplementasikan Real-Time Communication (40 points)
- [x] Mampu menggunakan fitur mailer (30 points)

## Pengujian Endpoint di postman

### register account

- [x] POST http://localhost:8080/auth/register
      [x]Contoh:
      {
      "name": "nama",
      "email": "email@mail.com",
      "password": "pass",
      "birthdate": "2004-07-11",
      "age": "19"
      }

### login

- [x] POST http://localhost:8080/auth/login
      - Contoh:
      {
      "email": "email@mail.com",
      "password": "pass"
      }

### forgot password

- [x] POST http://localhost:8080/auth/forgotPassword
      Contoh:
      {
      "email": "email@mail.com"
      }

### reset password

- [x] PUT http://localhost:8080/auth/resetPassword?token=
      Contoh:
      {
      "newPassword": "password"
      }

## Deploy in Railway

### register account

- [x] POST https://challenge-chapter-7-production.up.railway.app/auth/register
      Contoh:
      {
      "name": "nama",
      "email": "email@mail.com",
      "password": "pass",
      "birthdate": "2004-07-11",
      "age": "19"
      }

### login

- [x] POST https://challenge-chapter-7-production.up.railway.app/auth/login
      Contoh:
      {
      "email": "email@mail.com",
      "password": "pass"
      }

### forgot password

- [x] POST https://challenge-chapter-7-production.up.railway.app/auth/forgotPassword
      Contoh:
      {
      "email": "email@mail.com"
      }

### reset password

- [x] PUT https://challenge-chapter-7-production.up.railway.app/auth/resetPassword?token=
      Contoh:
      {
      "newPassword": "password"
      }
