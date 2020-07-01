const express = require('express');
const logger = require('../logger');
const xss = require('xss')
const BookmarkService = require('../bookmark-service');
const Knex = require('knex');

const bookmarksRouter = express.Router();
const bodyParser = express.json()

let sanitize = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: bookmark.rating
})

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarkService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.status(200).json(bookmarks.map(sanitize))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description, rating = 1 } = req.body;
        const newBookmark = { title, url, description, rating }

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
            else if (newBookmark.rating > 5 || newBookmark.rating < 1) {
                return res.status(400).json({
                    error: { message: `Rating must be a number between 1 and 5` }
                })
            }
        }

        BookmarkService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .json(sanitize(bookmark))

            })
            .catch(next)
    })

bookmarksRouter
    .route('/bookmarks/:bookmark_id')
    .get((req, res, next) => {

        const knexInstance = req.app.get('db')
        BookmarkService.getBookmarkById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: 'resource not found' }
                    })
                }
                res.json(sanitize(bookmark))
            })

            .catch(next)
    })

    .delete((req, res, next) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarkList.findIndex(el => el.id == id)

        if (bookmarkIndex === -1) {
            logger.error(`List with id ${id} not found.`);
            return res.status(404).send('No such bookmark')
        }

        BookmarkService.deleteBookmark(
            req.app.get('db'),
            id
        )

        .then(numRowsAffected => {
            logger.info(`Bookmark with id ${id} deleted.`)
            res.status(204).end()
          })
          .catch(next)

    })

module.exports = bookmarksRouter;