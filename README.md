# Bookmarks Server!

Use this api to and database directly to manage you bookmarks or connect this api to a client.

You can test this api with [this client](https://github.com/elireiner/bookmark-app-master) or its [deployed version](https://build-sigma-five.vercel.app)

This server handles GET, POST, DELETE and PATCH requests.

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

Add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and I can then `npm run deploy` which will push to this remote's master branch.

## Database handling

To connect to the herohu database from the CL run `heroku pg:psql`
Once connected, you can seed the db with `\i ./seeds/seed.bookmarks.sql`
