// FoalTS
import { AbstractProvider, SocialTokens } from './abstract-provider.service';

export class InvalidJWTError extends Error {}

export class GoogleProvider extends AbstractProvider {
  protected configPaths = {
    clientId: 'settings.social.google.clientId',
    clientSecret: 'settings.social.google.clientSecret',
    redirectUri: 'settings.social.google.redirectUri',
  };
  protected authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  protected tokenEndpoint = 'https://oauth2.googleapis.com/token';

  protected defaultScopes: string[] = [ 'openid', 'profile', 'email' ];

  getUserFromTokens(tokens: SocialTokens): object {
    try {
      const encodedPayload = tokens.id_token.split('.')[1];
      const decodedPayload = Buffer.from(encodedPayload, 'base64').toString('utf8');
      return JSON.parse(decodedPayload);
    } catch (error) {
      throw new InvalidJWTError(`The ID token returned by Google is not a valid JWT: ${error.message}.`);
    }
  }

}
