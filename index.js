import express, { application } from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
import { render } from 'ejs';
import {
  deleteProduct,
  postPo, postProductForm, postSchedule, putEditedProduct, renderAddSchedule, renderCalendar, renderForm, renderProductEditForm, renderProductForm, renderProductList, renderSingleProduct, renderSubmission,
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

// >>>>>>>> CRUD functions <<<<<<<<//

// render po form
app.get('/input', renderForm);

// insert new po to db
app.post('/input', postPo);

// render input product form
app.get('/input-product', renderProductForm);
// post product info into db
app.post('/input-product', postProductForm);

// render product list
app.get('/products', renderProductList);
app.get('/products/:id', renderSingleProduct);
// render editable product form
app.get('/products/:id/edit', renderProductEditForm);
// update edited info for product
app.put('/products/:id/edit', putEditedProduct);
// delete product entry
app.delete('/products/:id/delete', deleteProduct);

// render scheduling page
app.get('/add-schedule', renderAddSchedule);
app.post('/add-schedule', postSchedule);

// render calendar
app.get('/schedule', renderCalendar);
app.get('/submitted', renderSubmission);

app.listen(3004);
