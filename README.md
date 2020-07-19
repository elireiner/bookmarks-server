# Bookmarks Server!

This is a server side repo for the bookmarks-client!

This will handle requests for GET, POST, DELETE and PATCH.

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

Add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and I can then `npm run deploy` which will push to this remote's master branch.

## Database handling

To connect to the herohu database from the CL run `heroku pg:psql`
Once connected, you can seed the db with `\i ./seeds/seed.bookmarks.sql`