const welcomeEmail = (name: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Tour & Travels Teams</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Tour & Travels Teams! 🎉</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #333333; font-size: 24px; margin-top: 0;">Hi ${name},</h2>
            <p style="color: #666666; line-height: 1.6; font-size: 16px;">We're thrilled to have you on board! Thank you for signing up and joining our community. You've just taken the first step towards an amazing experience.</p>
            
            <p style="color: #666666; line-height: 1.6; font-size: 16px;">Your account has been successfully created, and you're all set to explore everything we have to offer.</p>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">What you can do:</h3>
                <div style="margin: 15px 0; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #667eea; font-weight: bold; font-size: 18px;">✓</span>
                    Access all premium features
                </div>
                <div style="margin: 15px 0; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #667eea; font-weight: bold; font-size: 18px;">✓</span>
                    Connect with other users
                </div>
                <div style="margin: 15px 0; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #667eea; font-weight: bold; font-size: 18px;">✓</span>
                    Personalize your experience
                </div>
                <div style="margin: 15px 0; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #667eea; font-weight: bold; font-size: 18px;">✓</span>
                    Get 24/7 customer support
                </div>
            </div>

            <p style="color: #666666; line-height: 1.6; font-size: 16px;">If you have any questions or need help getting started, don't hesitate to reach out to our support team. We're here to help!</p>

            <p style="color: #666666; line-height: 1.6; font-size: 16px;">Best regards,<br>
            <strong>The Tour & Travels Teams</strong></p>
        </div>

        <!-- Footer -->
        <div style="background-color: #333333; color: #ffffff; padding: 30px; text-align: center; font-size: 14px;">
            <div style="margin: 20px 0;">
                <a href="#" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none;">Facebook</a> | 
                <a href="#" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none;">Twitter</a> | 
                <a href="#" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none;">Instagram</a>
            </div>
            <p style="margin: 10px 0;">© ${new Date().getFullYear()} Tour & Travels Teams. All rights reserved.</p>
            <p style="margin: 10px 0;">
                <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
                <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
            </p>
        </div>
    </div>
</body>
</html>`;
};
export default welcomeEmail;
