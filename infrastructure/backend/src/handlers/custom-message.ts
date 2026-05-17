export const handler = async (event: any) => {
  if (event.triggerSource === 'CustomMessage_SignUp' || event.triggerSource === 'CustomMessage_ResendCode') {
    const code = event.request.codeParameter;
    const email = event.request.userAttributes.email;
    
    console.log('*****************************************************');
    console.log(`VERIFICATION CODE FOR ${email}: ${code}`);
    console.log('*****************************************************');
    
    // You can also customize the email message here if it actually gets sent
    event.response.emailSubject = "Your DevSaathi AI Verification Code";
    event.response.emailMessage = `Welcome to DevSaathi AI! Your verification code is ${code}`;
  }
  
  return event;
};
