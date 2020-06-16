const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');

const bookmarksRouter = express.Router();
const bodyParser = express.json()

const bookmarkList = [
    {
        id: "1",
        title: "Thinkful",
        URL: "Thinkful.com",
        Description: "Think outside the classroom",
        Rating: "5"
    },
    {
        id: "2",
        title: "Google",
        URL: "Google.com",
        Description: "Where we find everything else",
        Rating: "4"
    },
];


bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.status(200).json(bookmarkList)
    })
    .post(bodyParser, (req, res) => {
        const { title, URL, Description, Rating = 1 } = req.body;

        if (!title || !URL) {
            logger.error(`title and URL are required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        const id = uuid();

        const bookmark = {
            id,
            title,
            URL,
            Description,
            Rating
        }

        bookmarkList.push(bookmark);

        logger.info(`Bookmark with id ${id} created`);

        res
            .status(201)
            .location(`http://localhost:8000/list/${id}`)
            .json({ id });
    })

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params;
        console.log("id:", id);

        const bookmarkIndex = bookmarkList.findIndex(el => el.id == id)

        if (bookmarkIndex === -1) {
            logger.error(`List with id ${id} not found.`);
            return res.status(404).send(`Bookmark with id ${id} not found.`)
        }

        res.status(200).json(bookmarkList[bookmarkIndex])

    })
    .delete((req, res) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarkList.findIndex(el => el.id == id)

        if (bookmarkIndex === -1) {
            logger.error(`List with id ${id} not found.`);
            return res.status(404).send('No such bookmark')
        }

        bookmarkList.splice(bookmarkIndex, 1)

        logger.info(`List with id ${id} deleted.`)

        res.status(204).end();

    })

module.exports = bookmarksRouter;