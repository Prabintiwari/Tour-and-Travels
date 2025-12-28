const passwordResetSuccessEmail = (name: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
          <h1 style="margin: 0;">Password Changed Successfully!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="margin-top: 0;">Hi ${name}! 👋</h2>
          
          <div style="background: #e8f5e9; border-left: 4px solid #2ecc71; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>✓ Your password has been reset successfully!</strong>
            <p style="margin: 10px 0 0 0;">You can now log in to your account using your new password.</p>
          </div>

          <p>This email confirms that your password was changed on <strong>${new Date().toLocaleString(
            "en-US",
            {
              dateStyle: "full",
              timeStyle: "short",
            }
          )}</strong>.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🔐 Security Tips</h3>
            <div style="padding: 8px 0; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 18px;">•</span>
              <span>Use a strong, unique password for your account</span>
            </div>
            <div style="padding: 8px 0; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 18px;">•</span>
              <span>Never share your password with anyone</span>
            </div>
            <div style="padding: 8px 0; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 18px;">•</span>
              <span>Enable two-factor authentication if available</span>
            </div>
            <div style="padding: 8px 0; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 18px;">•</span>
              <span>Change your password regularly</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/login" style="display: inline-block; background: #2ecc71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Login to Your Account</a>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>⚠️ Didn't change your password?</strong>
            <p style="margin: 10px 0 0 0;">If you didn't make this change, please contact our support team immediately and secure your account.</p>
          </div>

          <p>If you have any questions or concerns, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br>Tour & Travels Teams</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>This is an automated security notification.</p>
          <p>&copy; ${new Date().getFullYear()} Tour & Travels Teams. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default passwordResetSuccessEmail;