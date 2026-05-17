import { Amplify } from 'aws-amplify';

try {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
        },
      },
    },
  });
} catch (error) {
  console.error('Amplify configuration failed:', error);
}

export default Amplify;
