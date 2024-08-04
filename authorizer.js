import { CognitoJwtVerifier } from "aws-jwt-verify";
const USER_POOL_ID = process.env.COGNITO_USERPOOL_ID;
const WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: "id",
  clientId: WEB_CLIENT_ID,
});
export const authorizer = async (event, context, cb) => {
  const token = event.authorizationToken;
  console.log("TOKEN:::::::", token);
  try {
    const payload = await jwtVerifier.verify(token);
    console.log(JSON.stringify(payload));
    cb(null, generatePolicy("user", "Allow", event.methodArn));
  } catch (error) {
    console.log(error);
    cb(null, generatePolicy("user", "Deny", event.methodArn));
  }
};
function generatePolicy(principalId, effect, resource) {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Resource: resource,
          Action: "execute-api:Invoke",
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  // will be passed
  authResponse.context = {
    foo: "bar",
  };

  console.log(JSON.stringify(authResponse));
  return authResponse;
}
