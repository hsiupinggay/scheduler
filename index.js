import express, { application } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
import { render } from 'ejs';
import {
  deleteProduct,
  logout,
  postLogin,
  postPo, postProductForm, postSchedule, postSignup, putEditedProduct, renderAddSchedule, renderCalendar, renderGanttChart, renderLogin, renderPoForm, renderProductEditForm, renderProductForm, renderProductList, renderSignup, renderSingleProduct, renderSubmission, SALT,
} from './routes.js';

const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());

// >>>>>>>> MIDDLE WARE <<<<<<<<//

// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));
// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));
// For CSS
app.use(express.static('public'));
// Password hashing
const hashing = (input) => {
// initialise SHA object for cookie string
  const unhashedCookieString = `${input}-${SALT}`;
  console.log(unhashedCookieString);

  const shaObjCookie = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  shaObjCookie.update(unhashedCookieString);
  const hashedCookieString = shaObjCookie.getHash('HEX');
  return hashedCookieString;
};

app.use((request, response, next) => {
  request.isUserLoggedIn = false;
  if (request.cookies.loggedInHash && request.cookies.userId) {
    const hashed = hashing(request.cookies.userId);
    if (hashed === request.cookies.loggedInHash) {
      request.isUserLoggedIn = true;
    }
  }
  next();
});

// >>>>>>>> CRUD functions <<<<<<<<//

// >>>>> po related <<<<< //

// render po form
app.get('/input', renderPoForm);

// insert new po to db
app.post('/input', postPo);

// >>>>> product related <<<<< //

// render input product form
app.get('/input-product', renderProductForm);

// post product info into db
app.post('/input-product', postProductForm);

// render product list
app.get('/products', renderProductList);

// render individual product entry
app.get('/products/:id', renderSingleProduct);

// render editable product form and update product in db
app.get('/products/:id/edit', renderProductEditForm);
app.put('/products/:id/edit', putEditedProduct);

// delete product entry
app.delete('/products/:id/delete', deleteProduct);

// >>>>> schedule related <<<<< //

// render scheduling page and post schedule to db
app.get('/add-schedule', renderAddSchedule);
app.post('/add-schedule', postSchedule);

// render calendar
app.get('/schedule', renderCalendar);
app.get('/gantt', renderGanttChart);

// >>>>> user authentication related <<<<< //
app.get('/signup', renderSignup);
app.post('/signup', postSignup);
app.get('/login', renderLogin);
app.post('/login', postLogin);
app.get('/logout', logout);

// >>>>> common <<<<< //

// render changes page after all submissions
app.get('/submitted', renderSubmission);

app.listen(3004);
