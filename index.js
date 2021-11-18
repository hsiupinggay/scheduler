import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
import { render } from 'ejs';
import { postPo, renderForm } from './routes.js';

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

app.listen(3004);
