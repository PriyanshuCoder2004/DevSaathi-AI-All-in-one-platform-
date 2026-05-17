export const handler = async (event: any) => {
  // Auto-confirm the user
  event.response.autoConfirmUser = true;

  // Auto-verify email if it exists in attributes
  if (event.request.userAttributes.hasOwnProperty('email')) {
    event.response.autoVerifyEmail = true;
  }

  // Auto-verify phone if it exists
  if (event.request.userAttributes.hasOwnProperty('phone_number')) {
    event.response.autoVerifyPhone = true;
  }

  return event;
};
