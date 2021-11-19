import { application, response } from 'express';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
import { DateTime } from 'luxon';
import { render } from 'ejs';

const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'hsiups',
  host: 'localhost',
  database: 'scheduler',
  port: 5432,
};
const pool = new Pool(pgConnectionConfigs);

// general callback for once query is completed
const whenDoneWithQuery = (error, result) => {
  if (error) {
    console.log('Error executing query', error.stack);
    response.status(503).send(result.rows);
    return;
  }
  console.table(result.rows);
};

// render form page
export const renderForm = (request, response) => {
  // select buyer
  console.log(request.query);
  const sqlQueryBuyer = 'SELECT * FROM buyers';
  let buyerList = [];
  pool
    .query(sqlQueryBuyer, (err, result) => {
    // [{id: , buyer_name: }]
      buyerList = [...result.rows];
      console.log({ buyerList });
      if (!request.query.buyer_id) {
        response.render('input-po', { buyerList, productList: undefined });
      } else {
        pool.query(`SELECT * FROM products WHERE buyer_id=${Number(request.query.buyer_id)}`, (err, result1) => {
          if (err) {
            console.log(err);
          }
          console.log('product list', result1.rows);
          console.log('buyer list', buyerList);
          const productList = result1.rows;
          response.render('input-po', { buyerList, productList });
        });
      }
    }); };

// post request to save PO to db
export const postPo = (request, response) => {
  const sqlQuery = 'INSERT INTO orders (client_po_no, product_id, shipment_date, quantity) VALUES $1, $2, $3, $4 RETURNING *';
  const inputValue = Object.values(request.body);
  console.log(inputValue);

  pool
    .query(sqlQuery, inputValue)
    .then((result) => {
      console.table(result.rows);
      response.send('PO submitted');
      // response.redirect('/allpo');
    })
    .catch((error) => console.log(error));
};

//  const buyerButton = document.querySelector(`#buyer-button`)
//       buyerButton.addEventListener('click', ()=>{

//       })
//       const sqlQueryProduct = 'SELECT * FROM products WHERE buyer_id = $1';
//       // get buyer id of selected buyer
//       const inputValue = [result.rows[0].id];
//       return pool.query(sqlQueryProduct, inputValue);
// // post form info into db
// export const postForm = (request, response) => {
//   const sqlQuery = 'INSERT INTO notes (date, flock_size, species_id, behaviour_id) VALUES ($1, $2, $3, $4) RETURNING *';
//   const inputData = Object.values(request.body);
//   console.log(inputData);
//   pool.query(sqlQuery, inputData, whenDoneWithQuery);
//   // redirect to
//   response.redirect('/changes');
// };

// // render existing note by id
// export const renderNote = (request, response) => {
//   const { index } = request.params;
//   const sqlQuery = 'SELECT * FROM notes INNER JOIN species ON species_id = species.id INNER JOIN behaviours ON notes.behaviour_id = behaviours.id WHERE notes.id = $1';
//   const inputData = [index];
//   console.log(inputData);
//   pool.query(sqlQuery, inputData, (error, result) => {
//     console.log(result.rows);
//     if (error) {
//       console.log('error', error);
//       return;
//     }
//     const note = result.rows[0];

//     response.render('single-note', { note });
//   });
// };

// // render all notes as links
// export const renderAllNotes = (request, response) => {
//   const sqlQuery = 'SELECT notes.id, notes.date, notes.flock_size, species.name, behaviours.behaviour FROM notes INNER JOIN species ON notes.species_id = species.id INNER JOIN behaviours ON notes.behaviour_id = behaviours.id';
//   pool.query(sqlQuery, (error, result) => {
//     if (error) {
//       console.log('error', error);
//       return;
//     }
//     const allNotes = result.rows;
//     allNotes.forEach((e) => {
//       e.date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
//     });
//     console.log(allNotes);
//     response.render('all-notes', { allNotes });
//   });
// };

// // render signup page
// export const renderSignup = (request, response) => {
//   response.render('signup');
// };

// // post username and password to users table
// export const postSignup = (request, response) => {
//   // initialise the SHA object
//   const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
//   // input the password from the request to the SHA object

//   shaObj.update(request.body.password);
//   // get the hashed password as output from the SHA object
//   const hashedPassword = shaObj.getHash('HEX');

//   // store hashed password in db
//   const sqlQuery = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *';
//   const queryInput = [request.body.email, hashedPassword];
//   pool.query(sqlQuery, queryInput, whenDoneWithQuery);
//   response.redirect('login');
// };

// // render login page
// export const renderLogin = (request, response) => {
//   response.render('login');
// };

// // post request to compare login password with db password
// export const postLogin = (request, response) => {
//   const sqlQuery = 'SELECT * FROM users WHERE email=$1';
//   const queryInput = [request.body.email];

//   pool.query(sqlQuery, queryInput, (error, result) => {
//     // did not find a user with that email
//     if (result.rows.length === 0) {
//       response.status(403).send('login failed!');
//     }

//     // initialise SHA object
//     const shaObjPassword = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
//     // input login password from the request to the SHA object
//     shaObjPassword.update(request.body.password);
//     const hashedInputPassword = shaObjPassword.getHash('HEX');
//     const dbPassword = result.rows[0].password;
//     console.log(result.rows);
//     console.log(request.body);
//     if (hashedInputPassword !== dbPassword) {
//       response.status(403).send('login failed!');
//       return;
//     }

//     // initialise SHA object for cookie string
//     const unhashedCookieString = `${request.body.email}-${SALT}`;
//     console.log(unhashedCookieString);

//     const shaObjCookie = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
//     shaObjCookie.update(unhashedCookieString);
//     const hashedCookieString = shaObjCookie.getHash('HEX');

//     response.cookie('loggedInHash', hashedCookieString);
//     response.cookie('userId', result.rows[0].email);
//     response.redirect('/notes');
//   });
// };

// export const logout = (request, response) => {
//   response.clearCookie('loggedInHash');
//   response.render('logout');
// };

export const renderChangesPage = (request, response) => {
  response.render('changes-received');
};
