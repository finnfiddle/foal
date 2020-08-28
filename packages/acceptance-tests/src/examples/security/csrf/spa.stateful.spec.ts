// std
import { strictEqual } from 'assert';

// 3p
import { Connection } from '@foal/typeorm/node_modules/typeorm';
import * as request from 'supertest';

// FoalTS
import {
  Context,
  controller,
  createApp,
  createSession,
  dependency,
  HttpResponseCreated,
  HttpResponseNoContent,
  HttpResponseUnauthorized,
  Post,
  TokenOptional,
  TokenRequired,
  ValidateBody,
  verifyPassword
} from '@foal/core';
import { DatabaseSession, TypeORMStore } from '@foal/typeorm';
import { createFixtureUser, createTestConnection, credentialsSchema, readCookie, User } from '../../../common';

describe('Feature: Stateful CSRF protection in a Single-Page Application', () => {

  /* ======================= DOCUMENTATION BEGIN ======================= */

  // auth.controller.ts
  class AuthController {
    @dependency
    // "Store" documentation
    store: TypeORMStore;

    @Post('/login')
    @ValidateBody(credentialsSchema)
    @TokenOptional({
      cookie: true,
      // Nothing in documentation
      store: TypeORMStore,
    })
    async login(ctx: Context) {
      const user = await User.findOne({ email: ctx.request.body.email });

      if (!user) {
        return new HttpResponseUnauthorized();
      }

      if (!await verifyPassword(ctx.request.body.password, user.password)) {
        return new HttpResponseUnauthorized();
      }

      ctx.session = ctx.session || await createSession(this.store);
      ctx.session.setUser(user);

      return new HttpResponseNoContent();
    }
  }

  // api.controller.ts
  @TokenRequired({
    cookie: true,
    // Nothing in documentation
    store: TypeORMStore,
  })
  class ApiController {
    @Post('/products')
    createProduct() {
      return new HttpResponseCreated();
    }
  }

  /* ======================= DOCUMENTATION END ========================= */

  class AppController {
    subControllers = [
      controller('', AuthController),
      controller('/api', ApiController),
    ];
  }

  const csrfCookieName = 'Custom-XSRF-Token';

  let connection: Connection;
  let user: User;

  let app: any;
  let sessionToken: string;
  let csrfToken: string;

  before(async () => {
    process.env.SETTINGS_SESSION_CSRF_ENABLED = 'true';
    process.env.SETTINGS_SESSION_CSRF_COOKIE_NAME = csrfCookieName;

    connection = await createTestConnection([ User, DatabaseSession ]);

    user = await createFixtureUser(1);
    await user.save();

    app = createApp(AppController);
  });

  after(async () => {
    delete process.env.SETTINGS_SESSION_CSRF_ENABLED;
    delete process.env.SETTINGS_SESSION_CSRF_COOKIE_NAME;

    await connection.close();
  });

  it('Step 1: User logs in and gets a CSRF token.', () => {
    return request(app)
      .post('/login')
      .send({
        email: user.email,
        password: 'password1',
      })
      .expect(204)
      .then(response => {
        const cookies: string[] = response.header['set-cookie'];
        strictEqual(cookies.length, 2, 'Expected two cookies in the response.');

        sessionToken = readCookie(cookies, 'sessionID').value;
        csrfToken = readCookie(cookies, csrfCookieName).value;
      });
  });

  it('Step 2: User cannot access POST routes with no CSRF token.', () => {
    return request(app)
      .post('/api/products')
      .set('Cookie', [
        `sessionID=${sessionToken}`,
        // The CSRF cookie is not required.
      ])
      .expect(403)
      .expect('CSRF token missing or incorrect.');
  });

  it('Step 3: User can access POST routes with the CSRF token.', () => {
    return request(app)
      .post('/api/products')
      .set('Cookie', [
        `sessionID=${sessionToken}`,
        // The CSRF cookie is not required.
      ])
      .set('X-XSRF-TOKEN', csrfToken)
      .expect(201);
  });

});
