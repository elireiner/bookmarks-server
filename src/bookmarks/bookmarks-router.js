const express = require('express');
const path = require('path')
const logger = require('../logger');
const xss = require('xss')
const BookmarkService = require('./bookmark-service');
const Knex = require('knex');

const bookmarksRouter = express.Router();
const jsonParser = express.json()

let sanitize = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: bookmark.rating
})

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarkService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.status(200).json(bookmarks.map(sanitize))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
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
    .route('/:bookmark_id')
    .all((req, res, next) => {
        const { bookmark_id } = req.params;
        BookmarkService.getBookmarkById(
            req.app.get('db'),
            bookmark_id
        )
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: 'resource not found' }
                    })
                }
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {

        const knexInstance = req.app.get('db')
        BookmarkService.getBookmarkById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                res.json(sanitize(bookmark))
            })

            .catch(next)
    })

    .delete((req, res, next) => {
        const { bookmark_id } = req.params;
        BookmarkService.deleteBookmark(
            req.app.get('db'),
            bookmark_id
        )

            .then(numRowsAffected => {
                logger.info(`Bookmark with id ${bookmark_id} deleted.`)
                res.status(204).end()
            })
            .catch(next)

    })
    .patch(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const updatedBookmark = { title, url, description, rating }

        const numberOfReqFields = Object.values(updatedBookmark).filter(Boolean).length
        if (numberOfReqFields == 0) {
           return res.status(400).json({
                error: { message: `Request body must contain either 'title', 'url', 'description', or 'rating'` }
            })
        }
        BookmarkService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            updatedBookmark
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter;