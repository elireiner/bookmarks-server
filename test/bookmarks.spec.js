const knex = require('knex')
const app = require('../src/app')
const { expect } = require('chai')
const { makeBookmarksArry, makeMaliciousBookmark } = require('./bookmarks.fixtures');
const supertest = require('supertest');


describe('bookmarks app', () => {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })


    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /api/bookmarks', () => {
        context('Given there are no bookmarks in the database', () => {
            it('Returns 200 and []', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .expect(200, [])
            })
        })

        context('when db is not empty', () => {
            const testBookmarks = makeBookmarksArry()

            beforeEach('insert bookmarks in table', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('return 200 and bookmarks', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .expect(200, testBookmarks)
            })
        })

        context('Given an xxs attack', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            beforeEach('insert bookmarks in table', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            })

            it('returns a sanitized bookmark', () => {

                return supertest(app)
                    .get(`/api/bookmarks`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })
            })
        })

    })

    describe('GET /api/bookmarks:bookmark_id', () => {

        context('when there is no data in the db', () => {

            it('returns error when bookmark not found', () => {
                const bookmarkId = 20
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: 'resource not found' } })
            })
        })

        context('when there is data in the db', () => {
            const testBookmarks = makeBookmarksArry()

            beforeEach('insert data in the db', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('returns 200 and correct bookmarks if exists', () => {
                const bookmarkId = 1;
                const expectBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .expect(200, expectBookmark)
            })

            it('return error when bookmark not found', () => {
                const bookmarkId = testBookmarks.length + 1
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: 'resource not found' } })
            })
        })

        context('Given an xxs attack', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            beforeEach('insert bookmarks in table', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            })

            it('returns a sanitized bookmark', () => {

                return supertest(app)
                    .get(`/api/bookmarks/${maliciousBookmark.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })
            })
        })
    })

    describe(`POST /api/bookmarks`, () => {
        it('returns 201 and returns inserted bookmark', () => {
            const newBookmark = {
                title: 'Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
                url: 'Donec semper sapien a libero.',
                description: 'Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.',
                rating: '1'
            };


            return supertest(app)
                .post(`/api/bookmarks`)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .expect(postRes.body))

        })

        context('Given a missing or incorrect field value', () => {
            const requiredFields = ['title', 'url', 'description'];
            requiredFields.forEach(field => {
                const newBookmark = {
                    title: 'Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
                    url: 'Donec semper sapien a libero.',
                    description: 'Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.',
                    rating: '1'
                }

                it(`responds with an error when ${field} is missing`, () => {
                    delete newBookmark[field];
                    return supertest(app)
                        .post('/api/bookmarks')
                        .send(newBookmark)
                        .expect(400, {
                            error: { message: `Missing '${field}' in request body` }
                        })
                })
            })

            it(`responds with an error when 'rating' is not in the rage of 1 to 5`, () => {
                let array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9,]
                array.forEach(num => {
                    const newBookmark = {
                        title: 'Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
                        url: 'Donec semper sapien a libero.',
                        description: 'Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.',
                        rating: `${num}`
                    }

                    if (num = 0 || num > 5) {
                        return supertest(app)
                            .post('/api/bookmarks')
                            .send(newBookmark)
                            .expect(400, {
                                error: { message: `Rating must be a number between 1 and 5` }
                            })

                    }
                })



            })
        })

        context('Given an xxs attack', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            it('returns a sanitized bookmark', () => {

                return supertest(app)
                    .post(`/api/bookmarks`)
                    .send(maliciousBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })


            })
        })

    })

    describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
        context('Given the book mark does exist', () => {
            const testBookmarks = makeBookmarksArry()

            beforeEach('insert data in the db', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('returns 201 and deletes bookmark', () => {
                const bookmarkId = 1;
                const expectBookmarkList = testBookmarks.filter(bookmark => bookmark.id !== bookmarkId)
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/bookmarks`)
                            .expect(200, expectBookmarkList)
                    })
            })
        })
        context('Given the bookmark does not exist', () => {
            it('returns 201 and deletes bookmark', () => {
                const bookmarkId = 1;

                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: 'resource not found' } })

            })
        })
    })

    describe('PATCH /api/bookmarks', () => {
        context('when there are no bookmarks in the db', () => {
            it('returns 404', () => {
                const idToUpdate = 1234
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .expect(404)
            })
        })

        context('when there are bookmarks in the db', () => {
            const testBookmarks = makeBookmarksArry()

            beforeEach('insert data in the db', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('Responds with error when there is no bookmark id in the URL', () => {
                    const updatedBookmark = {
                    title: 'Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
                    url: 'Donec semper sapien a libero.',
                    description: 'Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.',
                    rating: '1'
                }

                return supertest(app)
                .patch(`/api/bookmarks`)
                .send(updatedBookmark)
                .expect(404)

            })

            it('updates the bookmark correctly', () => {
                const idToUpdate = 2

                const updatedBookmark = {
                    title: 'Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
                    url: 'Donec semper sapien a libero.',
                    description: 'Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.',
                    rating: '1'

                }

                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updatedBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send(updatedBookmark)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .expect(expectedBookmark)
                    )

            })

            it('responsd with 400 when no required field are sent', () => {
                const idToUpdate = 2
                const testBookmark = {
                    nonRequiredField: 'nothing and nothing'
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send(testBookmark)
                    .expect(400, {
                        error: { message: `Request body must contain either 'title', 'url', 'description', or 'rating'` }
                    })
            })

            it('Only updates required fields', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated bookmark title'
                }

                const expectBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send({
                        ...updateBookmark,
                        fieldToIgnore: 'ignore me'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .expect(200, expectBookmark)
                    )
            })
        })
    })
})
