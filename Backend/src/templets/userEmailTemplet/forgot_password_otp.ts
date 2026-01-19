const Password_Reset_OTP = (otp: string, name: string, expiryMinutes = 10) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #DC2626; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Hello ${name},
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the password reset process:
              </p>
              
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="background-color: #FEF2F2; border: 2px dashed #DC2626; border-radius: 8px; padding: 20px; display: inline-block;">
                      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #DC2626; font-family: 'Courier New', monospace;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px; color: #666666; font-size: 14px; line-height: 1.5; text-align: center;">
                This OTP will expire in <strong>${expiryMinutes} minutes</strong>
              </p>
              
              <p style="margin: 20px 0 10px; color: #DC2626; font-size: 14px; line-height: 1.5; font-weight: bold;">
                ⚠️ Security Notice:
              </p>
              
              <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.5;">
                If you didn't request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed unless you use this OTP.
              </p>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                If you have concerns about your account security, please contact our support team immediately.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © ${new Date().getFullYear()} Tour & Travels Teams. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export default Password_Reset_OTP;
