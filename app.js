const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.PORT || 5000;
const mongodbURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.btdla2l.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const cors = require('cors');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri: mongodbURL,
  collection: 'sessions',
});

const app = express();

// Set trust proxy to configure Express.js
// to trust the proxy server that your app is running behind
app.set('trust proxy', 1);

// Set up Cross-Origin Resource Sharing (CORS) middleware
app.use(
  cors({
    // Allow requests from http://localhost:3000
    // origin: "http://localhost:3000",
    origin: [
      'https://charitee-rj-tw.netlify.app',
      'https://charitee-fe.vercel.app',
    ],
    // Allow POST, PUT, GET, OPTIONS, and HEAD methods
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
    // Allow credentials to be passed with requests
    credentials: true,
  })
);

// Set up session management middleware
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'none', secure: true, maxAge: 1000 * 60 * 60 },
    store: store,
  })
);

// app.use(
//   session({
//     // Secret used to sign the session ID cookie
//     secret: "my secret",
//     // Disable automatic session storage when changes aren't made
//     resave: false,
//     // Prevent creating a new session if no changes are made
//     saveUninitialized: false,
//     // Set options object for the session middleware cookie
//     cookie: {
//       // Set sameSite attribute to lax to allow cross-site requests
//       sameSite: "lax",
//       // Disable HTTPS requirement
//       secure: false,
//       // Set maximum age to 1 hour
//       maxAge: 1000 * 60 * 60,
//     },
//     // Store session data in external store
//     store: store,
//   })
// );

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res, next) => {
  return res.send('Connected');
});

const accountController = require('./controller/accountController');
const causeController = require('./controller/causeController');
const donationController = require('./controller/donationController');

const causeRouter = express.Router();
const accountRouter = express.Router();

// Cause Routes
causeRouter
  .route('/')
  .get(causeController.getCause)
  .post(accountController.checkAdmin, causeController.addCause)
  .put(accountController.checkAdmin, causeController.updateCause);

causeRouter
  .route('/delete')
  .post(accountController.checkAdmin, causeController.deleteCause);

// Account Routes
accountRouter
  .route('/')
  .get(accountController.getAccount)
  .post(accountController.addAccount);

accountRouter
  .route('/delete')
  .post(accountController.checkAdmin, accountController.deleteAccount);

accountRouter.route('/:id').put(accountController.updateAccount);

accountRouter
  .route('/confirm/:accountID')
  .post(accountController.verifyAccount);

accountRouter
  .route('/request-reset-password')
  .post(accountController.requestResetPassword);

accountRouter
  .route('/reset-password')
  .post(accountController.verifyResetPassword);

accountRouter
  .route('/change-role')
  .post(accountController.checkAdmin, accountController.changeRole);

accountRouter.route('/check-session').get(accountController.checkSession);

accountRouter.route('/login').post(accountController.login);

accountRouter.route('/logout').get(accountController.logout);

// Mount the routers onto the app
app.use('/cause', causeRouter);
app.use('/account', accountRouter);

//GET DONATION DETAIL
app.get('/donations', donationController.getDonation);

app.post('/payment/create-payment', donationController.createPayment);

app.post('/payment/execute-payment', donationController.executePayment);

mongoose
  .connect(mongodbURL)
  .then((result) => {
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
