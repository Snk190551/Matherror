<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>เข้าสู่ระบบ</title>
  <link rel="stylesheet" href="style.css">
  <!-- นำเข้า Google Identity Services Library สำหรับ Google Sign-In -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    /* เพิ่ม CSS เพื่อจัดวางกล่องล็อกอินและปุ่ม Google Sign-In ให้อยู่ข้างกัน */
    .login-container {
      display: flex; /* ใช้ Flexbox เพื่อจัดวางองค์ประกอบข้างกัน */
      justify-content: center; /* จัดให้อยู่ตรงกลางแนวนอน */
      align-items: flex-start; /* จัดให้อยู่ด้านบนแนวตั้ง */
      gap: 30px; /* ระยะห่างระหว่างกล่องล็อกอินและปุ่ม Google */
      padding-top: 50px; /* เพิ่มระยะห่างจากด้านบน */
    }

    .google-signin-box {
      background-color: rgba(255, 255, 255, 0.9); /* สีขาวโปร่งใส */
      backdrop-filter: blur(5px); /* เพิ่มเอฟเฟกต์เบลอ */
      padding: 30px;
      border-radius: 12px; /* มุมโค้งมน */
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3); /* เงา */
      text-align: center;
      max-width: 300px; /* กำหนดความกว้างสูงสุด */
      width: 100%;
      margin-top: 50px; /* จัดให้สูงเท่ากับกล่อง login-box */
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #333; /* สีตัวอักษรสำหรับกล่อง Google Sign-In */
    }

    .google-signin-box h3 {
      margin-bottom: 20px;
      color: #333;
    }
    /* ปรับแต่งปุ่ม Google Sign-In เพิ่มเติมหากต้องการ */
    .g_id_signin {
        margin-top: 20px; /* เพิ่มระยะห่างจากข้อความ */
    }
  </style>
</head>
<body onload="checkLogin()"> <!-- เรียกใช้ checkLogin เมื่อโหลดหน้า -->
  <div class="login-container">
    <div class="login-box">
      <h2>เข้าสู่ระบบ</h2>
      <form onsubmit="return login(event)">
        <div class="input-group">
          <label for="username">ชื่อผู้ใช้ / อีเมล</label>
          <input type="text" id="username" required>
        </div>
        <div class="input-group">
          <label for="password">รหัสผ่าน</label>
          <input type="password" id="password" required>
        </div>
        <button type="submit">เข้าสู่ระบบ</button>
        <p id="message"></p> <!-- สำหรับแสดงข้อความสถานะการล็อกอิน -->
        <p style="text-align:center;margin-top:10px;">
          <a href="register.html">ยังไม่มีบัญชี? สมัครสมาชิก</a>
        </p>
        <p style="text-align:center;margin-top:10px;">
          <a href="reset.html">ลืมรหัสผ่าน? คลิกที่นี่</a>
        </p>
      </form>
    </div>

    <!-- ส่วนสำหรับ Google Sign-In -->
    <div class="google-signin-box">
      <h3>หรือเข้าสู่ระบบด้วย</h3>
      <div id="g_id_onload"
           data-client_id="896330929514-ktrmgrol8v2he3dubl591j0cap13np5p.apps.googleusercontent.com"
           data-callback="handleCredentialResponse"> <!-- data-client_id ของคุณ -->
      </div>
      <div class="g_id_signin"
           data-type="standard"
           data-size="large"
           data-theme="outline"
           data-text="sign_in_with"
           data-shape="rectangular"
           data-logo_alignment="left">
      </div>
    </div>
  </div>

  <script src="script.js"></script> <!-- นำเข้า JavaScript หลัก -->
</body>
</html>
