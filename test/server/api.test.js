import nconf from 'nconf'
import supertest from 'supertest'
import { expect } from 'chai'

import MountebankClient from '../MountebankClient'
import MockStrategy from '../passport/MockStrategy'
import { init as initApp } from '../../server/server'
import { syncDB, Repository } from '../../server/model'

describe('API', () => {
  const app = initApp({PassportStrategy: MockStrategy})
  const mountebank = new MountebankClient()
  const request = supertest.agent(app.listen())
  const imposter = {
    port: 4242,
    name: 'github'
  }

  before(async function (done) {
    // Override config values
    nconf.set('GITHUB_URL', `http://localhost:${imposter.port}`)

    try {
      // Initialize database
      await syncDB()

      // Configure mountebank
      const mb = await mountebank.start()
      const imp = await mb.imposter().
      setPort(imposter.port).
      setName(imposter.name).
      stub().
        response().
          setStatusCode(200).
          setHeader('Content-Type', 'application/json').
          setBody(require('../fixtures/github.user.repos.json')).
        add().
        predicate().
          setPath('/user/repos').
          setMethod('GET').
        add().
      add().
      create()
    } catch (err) {
      done(err)
    }

    // Initialize session
    request
      .get('/auth/github')
      .end(done)
  })

  after(async function (done) {
    try {
      await mountebank.stop()
      done()
    } catch (err) {
      done(err)
    }
  })

  describe('GET /api/repos', () => {
    it('should respond with github repos', done => {
      request
        .get('/api/repos')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(response => {
          expect(response.body).to.be.an('array').and.to.have.length.above(1)
        })
        .end(done)
    })

    it('should cache the response in the database', done => {
      request
        .get('/api/repos')
        .end(async function (err, {body}) {
          if (err) return done(err)

          try {
            const user = MockStrategy.props.user
            const repos = await Repository.userScope(user).findAllSorted()
            expect(repos).to.have.length.within(body.length, body.length)
            expect(repos[0]).to.have.property('id').equal(body[0].id)
            done()
          } catch (err) {
            return done(err)
          }
        })
    })
  })
})
