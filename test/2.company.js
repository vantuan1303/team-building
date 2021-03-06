const expect = require('chai').expect
const request = require('supertest')
const app = require('../app')

let signedUserTokenKey = '' // Save user login tokenkey
let companyIdEdited = '' // Use to update, delete this company with Id
let userIds // Array user will add to company
let userId // Set this user to company manager

describe('POST /auth/login', () => {
    it('Ok, login admin again', done => {
        request(app).post(`/auth/login`)
            .send({ email: 'vantuan130393@gmail.com', password: '12345678a' })
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('user')
                expect(body.user).to.contain.property('tokenKey')
                signedUserTokenKey = body.user.tokenKey
                // Save token key to global variable and use it in other test
                done()
            })
            .catch((error) => done(error))
    })
})

describe('POST /company', () => {
    it('OK, create new company with emaildomain amavi.asia', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'Company AMAVI', emailDomain: 'amavi.asia', address: 'Ho Chi Minh City, Vietnam' })
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                expect(body.company.name).to.equals('Company AMAVI')
                expect(body.company.emailDomain).to.equals('amavi.asia')
                done()
            })
            .catch((error) => done(error))
    })

    it('OK, create new company with none email domain', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'PA Viet Nam', address: 'Ho Chi Minh City, Vietnam' })
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                expect(body.company.name).to.equals('PA Viet Nam')

                done()
            })
            .catch((error) => done(error))
    })

    it('OK, create new company with emaildomain heroku.com', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'Heroku Website', emailDomain: 'heroku.com', address: 'United Status' })
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                expect(body.company.name).to.equals('Heroku Website')
                expect(body.company.emailDomain).to.equals('heroku.com')
                done()
            })
            .catch((error) => done(error))
    })

    it('OK, create new company with emaildomain vietjet.com', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'Vietjet Travel', emailDomain: 'vietjet.com', address: 'United Status' })
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                expect(body.company.name).to.equals('Vietjet Travel')
                expect(body.company.emailDomain).to.equals('vietjet.com')
                done()
            })
            .catch((error) => done(error))
    })

    it('Fail, email domain = gmail.com', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'Company AMAVI', emailDomain: 'gmail.com', address: 'Ho Chi Minh City, Vietnam' })
            .then(res => {
                expect(res.statusCode).to.equals(400)
                done()
            })
            .catch((error) => done(error))
    })

    it('Fail, duplicate email domain', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'Company AMAVI', emailDomain: 'amavi.asia', address: 'Ho Chi Minh City, Vietnam' })
            .then(res => {
                expect(res.statusCode).to.equals(400)
                done()
            })
            .catch((error) => done(error))
    })

    it('Fail, wrong email domain format', done => {
        request(app).post('/company')
            .set({ 'x-access-token': signedUserTokenKey })
            .send({ name: 'Company AMAVI', emailDomain: 'amaviasia', address: 'Ho Chi Minh City, Vietnam' })
            .then(res => {
                expect(res.statusCode).to.equals(400)
                done()
            })
            .catch((error) => done(error))
    })
})

describe('GET /company', () => {
    it('OK, Query list of companies', done => {
        request(app).get('/company')
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('companies')
                expect(body.companies.length).to.equals(4)
                done()
            })
            .catch((error) => done(error))
    })
})

describe('GET /company/get-by-email-domain', () => {
    it('OK, get company by email domain', done => {
        request(app).get('/company/get-by-email-domain/' + 'vietjet.com')
            .then(res => {
                const body = res.body
                companyIdEdited = body.company._id
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                done()
            })
            .catch((error) => done(error))
    })
})

describe('GET /company/:companyId', () => {
    it('OK, get detail company', done => {
        request(app).get('/company/' + companyIdEdited)
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                done()
            })
            .catch((error) => done(error))
    })
})

describe('PUT /company/:companyId', () => {
    it('OK, update company', done => {
        request(app).put('/company/' + companyIdEdited)
        .set({ "x-access-token": signedUserTokenKey })
        .send({ name: 'VietJet Edited' })
        .then(res => {
            const body = res.body
            expect(res.statusCode).to.equals(200)
            expect(body).to.contain.property('company')
            done()
        })
        .catch((error) => done(error))
    })
})

describe('DELETE /company/:companyId', () => {
    it('OK, delete company', done => {
        request(app).delete(`/company/${companyIdEdited}`)
        .set({ "x-access-token": signedUserTokenKey })
        .then(res => {
            expect(res.statusCode).to.equals(200)
            done()
        })
        .catch((error) => done(error))
    })
})

describe('GET /company/get-by-email-domain', () => {
    it('OK, get company by email domain', done => {
        request(app).get('/company/get-by-email-domain/' + 'amavi.asia')
            .then(res => {
                const body = res.body
                companyIdEdited = body.company._id
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('company')
                done()
            })
            .catch((error) => done(error))
    })
})

describe('GET /user/get-by-email-domain/:emailDomain', () => {
    it('OK, find user by email', done => {
        request(app).get('/user/get-by-email-domain/' + "amavi.asia")
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('users')
                userIds = body.users.map( user => user._id)
                // Save userId to global variable and use it to get detail, update, delete user
                done()
            })
            .catch(error => done(error))
    })
})

describe('POST /company/:companyId/add-members', () => {
    it('OK, add member', done => {
        request(app).post(`/company/${companyIdEdited}/add-members`)
        .set({ "x-access-token": signedUserTokenKey })
        .send({userIds})
        .then(res => {
            expect(res.statusCode).to.equals(200)
            done()
        })
        .catch((error) => done(error))
    })

    it('Fail, wrong memberId', done => {
        request(app).post(`/company/${companyIdEdited}/add-members`)
        .set({ "x-access-token": signedUserTokenKey })
        .send({userIds: "5d70d3ccee62e71cd16591a3"})
        .then(res => {
            expect(res.statusCode).to.equals(400)
            done()
        })
        .catch((error) => done(error))
    })
})

describe('POST /company/:companyId/remove-member', () => {
    it('OK, remove member', done => {
        request(app).post(`/company/${companyIdEdited}/remove-member`)
        .set({ "x-access-token": signedUserTokenKey })
        .send({userId: userIds[2]})
        .then(res => {
            expect(res.statusCode).to.equals(200)
            done()
        })
        .catch((error) => done(error))
    })
})

describe('GET /user/get-by-email/:email', () => {
    it('OK, find user with email: tuan.nv@amavi.asia to set company manager', done => {
        request(app).get('/user/get-by-email/' + "tuan.nv@amavi.asia")
            .then(res => {
                const body = res.body
                expect(res.statusCode).to.equals(200)
                expect(body).to.contain.property('user')
                userId = body.user._id
                // Save userId to global variable and use it to get detail, update, delete user
                done()
            })
            .catch(error => done(error))
    })
})

describe('POST /company/:companyId/change-user-role', () => {
    it('OK, change user role', done => {
        request(app).post(`/company/${companyIdEdited}/change-user-role`)
        .set({ "x-access-token": signedUserTokenKey })
        .send({userId, role: "manager"})
        .then(res => {
            expect(res.statusCode).to.equals(200)
            done()
        })
        .catch((error) => done(error))
    })
})

describe('POST /company/:companyId/upgrade-vip', () => {
    it('OK, upgrade vip', done => {
        request(app).post(`/company/${companyIdEdited}/upgrade-vip`)
        .set({ "x-access-token": signedUserTokenKey })
        .send({vip: 'vip3'})
        .then(res => {
            expect(res.statusCode).to.equals(200)
            done()
        })
        .catch((error) => done(error))
    })
})