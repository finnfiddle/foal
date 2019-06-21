// std
import { strictEqual } from 'assert';

// FoalTS
import { Session, verifySignedToken } from '@foal/core';
import { getCsrfToken } from './get-csrf-token.util';

describe('getCsrfToken', () => {

  afterEach(() => delete process.env.SETTINGS_CSRF_ENABLED);

  it('should return "CSRF protection disabled" if settings.csrf.enabled is false.', async () => {
    process.env.SETTINGS_CSRF_ENABLED = 'false';
    const token = await getCsrfToken();
    strictEqual(token, 'CSRF protection disabled');
  });

  describe('given session is undefined.', () => {

    afterEach(() => delete process.env.SETTINGS_CSRF_SECRET);

    it('should throw an error if the configuration key settings.csrf.secret is empty.', async () => {
      try {
        await getCsrfToken();
        throw new Error('An error should have been thrown.');
      } catch (error) {
        strictEqual(
          error.message,
          '[CONFIG] You must provide a secret with the configuration key settings.csrf.secret.'
        );
      }
    });

    it('should generate a signed token.', async () => {
      const secret = 'csrf-secret';
      process.env.SETTINGS_CSRF_SECRET = secret;
      const signedToken = await getCsrfToken();
      strictEqual(typeof verifySignedToken(signedToken, secret), 'string');
    });

  });

  describe('given session is defined.', () => {

    it('should throw an error if the session key "csrfToken" is empty.', async () => {
      const session = new Session('a', {}, 0);
      try {
        await getCsrfToken(session);
        throw new Error('An error should have been thrown.');
      } catch (error) {
        strictEqual(
          error.message,
          'getCsrfToken requires the use of @CsrfTokenRequired.'
        );
      }
    });

    it('should return the value of the session key "csrfToken".', async () => {
      const session = new Session('a', { csrfToken: 'xxx' }, 0);
      const csrfToken = await getCsrfToken(session);
      strictEqual(csrfToken, 'xxx');
    });

  });

});
