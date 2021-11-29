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
export const SALT = 'aiho aiho off to the mines we go';

// >>>>> po related <<<<< //

// render form page for adding PO
export const renderPoForm = (request, response) => {
  if (request.isUserLoggedIn === false) {
    response.status(403).redirect('/login');
  } else {
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
      }); } };

// post po to db
export const postPo = (request, response) => {
  console.log(request.body);
  console.log('items array', request.body.items);
  const orderObj = {};
  Object.keys(request.body).filter((key) => key !== 'items').forEach((item) => {
    if ((request.body.items).includes(item) && !orderObj[item]) {
      orderObj[item] = request.body[item];
    }
  });
  const clientPoNo = request.body.client_po_no;
  const shipmentDate = request.body.shipment_date;
  console.log('order obj', orderObj);
  console.log('client Po No. =', clientPoNo);
  console.log('shipment date. =', shipmentDate);

  Object.keys(orderObj).forEach((key) => {
    // inputValue = [client_po_no, shipment_date, product_id, quantity]
    const inputValue = [clientPoNo, key, shipmentDate, orderObj[key]];
    const sqlQuery = 'INSERT INTO orders (client_po_no, product_id, shipment_date, quantity) VALUES ($1, $2, $3, $4) RETURNING *';
    pool
      .query(sqlQuery, inputValue)
      .then((result) => {
        console.table(result.rows);
        response.redirect('/submitted');
      }).catch((error) => console.log(error)); });
};

// >>>>> product related <<<<< //

export const renderProductForm = (request, response) => {
  if (request.isUserLoggedIn === false) {
    response.status(403).redirect('/login');
  } else {
    pool
      .query('SELECT * FROM buyers')
      .then((result) => {
        const buyerList = result.rows;
        console.log(result.rows);
        response.render('input-product', { buyerList });
      });
  } };

export const postProductForm = (request, response) => {
  // validate input to prevent duplicates
  const inputValues = Object.values(request.body);
  const inputDescription = request.body.description;
  console.log(`input description =${inputDescription}`);
  let duplicateFound = false;
  const sqlQueryCheckDuplicate = 'SELECT description FROM products';
  pool
    .query(sqlQueryCheckDuplicate)
    .then((result) => {
      // validate if product description already exists
      result.rows.forEach((e) => {
        if (e.description.toLowerCase() === inputDescription.toLowerCase()) {
          duplicateFound = true;
          console.log('duplicate found');
        }
      });
      if (duplicateFound === false) {
        console.log('input into data base ran');
        pool
          .query('INSERT INTO products (description,buyer_id,weld_counter,polish_counter,weave_counter) VALUES ($1,$2, $3, $4, $5) RETURNING *', inputValues)
          .then((result) => {
            console.table(result.rows);
            response.redirect('/submitted');
          });
      }
    }); };

export const renderProductList = (request, response) => {
  pool
    .query('SELECT * FROM buyers')
    .then((result) => {
      const buyerList = result.rows;
      console.log(result.rows);

      if (!request.query.buyer_id) {
        pool
          .query('SELECT products.id, description, weld_counter, polish_counter, weave_counter, buyers.buyer_name FROM products INNER JOIN buyers ON products.buyer_id = buyers.id ORDER BY description ASC')
          .then((result) => {
            const allProducts = result.rows;
            console.log(result.rows);
            response.render('all-products', { allProducts, buyerList });
          })
          .catch((error) => console.log(error));
      } else {
        const inputValue = [Number(request.query.buyer_id)];
        console.log(inputValue);
        pool
          .query('SELECT products.id, description, weld_counter, polish_counter, weave_counter, buyers.buyer_name, buyer_id FROM products INNER JOIN buyers ON products.buyer_id = buyers.id WHERE products.buyer_id = $1 ORDER BY description ASC', inputValue)
          .then((result) => {
            const allProducts = result.rows;
            console.log(result.rows);
            response.render('all-products', { allProducts, buyerList });
          })
          .catch((error) => console.log(error));
      }
    });
};

// render individual product page
export const renderSingleProduct = (request, response) => {
  const { id } = request.params;
  console.log(id);
  pool
    .query('SELECT products.id, description, weld_counter, polish_counter, weave_counter, buyers.buyer_name FROM products INNER JOIN buyers ON products.buyer_id = buyers.id WHERE products.id = $1', [id])
    .then((result) => {
      const data = result.rows;
      console.log({ data });
      response.render('single-product', { data });
    });
};

// render product editable form
export const renderProductEditForm = (request, response) => {
  if (request.isUserLoggedIn === false) {
    response.status(403).redirect('/login');
  } else {
    console.log('render edit running');
    const { id } = request.params;
    console.log(id);

    pool
      .query('SELECT * FROM buyers')
      .then((result1) => {
        const buyerList = result1.rows;
        // console.log(buyerList);
        pool
          .query('SELECT products.id, description, buyer_id, buyers.buyer_name, weld_counter, polish_counter, weave_counter FROM products INNER JOIN buyers ON buyers.id = buyer_id WHERE products.id = $1', [id])
          .then((result2) => {
            const product = result2.rows;
            console.log(product);
            response.render('edit-product', { product, buyerList });
          });
      })
      .catch((error) => { console.log(error); });
  } };

// update info to proudct db
export const putEditedProduct = (request, response) => {
  const inputData = Object.values(request.body);
  const { id } = request.params;
  inputData.push(id);
  console.log(request.body);
  console.log(inputData);
  pool.query('UPDATE products SET description = $1, buyer_id = $2, weld_counter = $3, polish_counter = $4, weave_counter = $5 WHERE products.id = $6', inputData)
    .then((result) => {
      response.redirect('/submitted');
    })
    .catch((error) => console.log(error));
};

// delete individual product entry
export const deleteProduct = (request, response) => {
  if (request.isUserLoggedIn === false) {
    response.status(403).redirect('/login');
  } else {
    const { id } = request.params;
    pool.query('DELETE FROM products WHERE id = $1', [id])
      .then((result) => {
        response.redirect('/submitted');
      })
      .catch((error) => console.log(error));
  } };

// >>>>> schedule related <<<<< //

export const renderAddSchedule = (request, response) => {
  if (request.isUserLoggedIn === false) {
    response.status(403).redirect('/login');
  } else {
    const sqlQueryFilterBuyer = 'SELECT * FROM buyers';
    // initialising variables for multiple filters
    let buyerList = [];
    let poList = [];
    let data;
    pool
      .query(sqlQueryFilterBuyer, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return;
        }
        buyerList = [...result1.rows];
        if (!request.query.buyer_id) {
          response.render('add-schedule', { buyerList, poList: undefined, data: undefined });
        } else {
          pool.query(`SELECT client_po_no, buyer_id FROM orders INNER JOIN products ON orders.product_id = products.id INNER JOIN buyers ON products.buyer_id = buyers.id WHERE products.buyer_id=${Number(request.query.buyer_id)}`)
            .then((result2) => {
              poList = [...new Set(result2.rows.map(JSON.stringify))].map(JSON.parse);
              console.log('new po list');
              console.log(poList);
              // console.log(poList);
              // console.log(request.query);
              if (!request.query.client_po_no) {
                response.render('add-schedule', { buyerList, poList, data: undefined });
              } else {
                console.log('final sql query running');
                console.log(request.query.client_po_no);
                // console.log(request.query.client_po_no);
                const sqlQuery = `SELECT orders.id AS order_id, client_po_no, shipment_date, quantity, description, products.id AS product_id, weld_counter, polish_counter, weave_counter, buyer_name FROM orders INNER JOIN products ON orders.product_id = products.id INNER JOIN buyers ON buyers.id = products.buyer_id WHERE client_po_no = '${request.query.client_po_no}'`;
                pool
                  .query(sqlQuery)
                  .then((result3) => {
                    data = result3.rows;
                    // changing date format of shipment date in each object in data
                    data.forEach((e) => {
                      e.shipment_date = DateTime.fromJSDate(e.shipment_date).toLocaleString(DateTime.DATE_MED);
                    });

                    console.log('data');
                    console.log(data);
                    response.render('add-schedule', { buyerList, poList, data });
                  })
                  .catch((err2) => { console.log(err2); });
              }
            });
        }
      }); } };

export const postSchedule = (request, response) => {
  console.log(request.body);
  const data = request.body;

  const sqlQueryOrderOverview = 'INSERT INTO orders_overview (client_po_no, shipment_date, production_start, production_end) VALUES ($1, $2, $3, $4) RETURNING *';
  const shipmentDate = new Date(data.shipment_date);

  const orderOverviewInput = [data.client_po_no, shipmentDate, data.production_start, data.production_end];

  // repackaging data from request.body so that it's easy to input
  const newData = [];
  const keysArray = Object.keys(data);
  const valuesArray = Object.values(data);
  // remove first 4 keys and values, as these are data to be inserted into orders_overview table
  // first four keys have corresponding values that are not arrays, and will affect repackaging of array values that need to be added to orders table
  keysArray.splice(0, 4);
  console.log(keysArray);
  valuesArray.splice(0, 4);
  console.log(valuesArray);

  // this loop is what I'm proudest of in this whole project
  for (let i = 0; i < valuesArray[0].length; i += 1) {
    const newObj = {};
    for (let j = 0; j < keysArray.length; j += 1) {
      newObj[keysArray[j]] = valuesArray[j][i];
    }
    newData.push(newObj);
  }
  console.log(newData);
  pool
    .query(sqlQueryOrderOverview, orderOverviewInput)
    .then((result1) => {
      console.log(result1.rows);
      newData.forEach((obj) => {
        const inputData = [obj.order_id, obj.product_id, obj.weld_start, obj.weld_period_days, obj.polish_start, obj.polish_period_days, obj.weave_start, obj.weave_period_days];
        const sqlQuery = 'INSERT INTO schedule (order_id, product_id, weld_start, weld_period_days, polish_start, polish_period_days, weave_start, weave_period_days) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
        pool
          .query(sqlQuery, inputData)
          .then((result2) => {
            console.table(result2.rows);
            response.redirect('/submitted');
          })
          .catch((error) => console.log(error));
      });
    });
};

export const renderCalendar = (request, response) => {
  pool.query('SELECT * FROM orders_overview')
    .then((result) => {
      const data = result.rows;
      const events = [];
      data.forEach((e) => {
        const event = {};
        let shipmentDate = e.shipment_date;

        console.log(e.shipment_date);
        shipmentDate = DateTime.fromJSDate(shipmentDate).toLocaleString(DateTime.DATE_MED);
        console.log(shipmentDate);

        event.title = `${e.client_po_no} | Due ⏰ ${shipmentDate}`;
        event.start = e.production_start;
        event.end = e.production_end;
        event.allDay = true;
        events.push(event);
      });
      response.render('calendar', { events });
    })
    .catch((error) => console.log(error));
};

export const renderGanttChart = (request, response) => {
  const sqlQuery = 'SELECT order_id, orders.client_po_no, orders.quantity, weld_start, weld_period_days, polish_start, polish_period_days, weave_start, weave_period_days, products.description   FROM schedule INNER JOIN products ON schedule.product_id = products.id INNER JOIN orders ON schedule.order_id = orders.id';

  pool.query(sqlQuery)
    .then((result) => {
      const data = result.rows;
      console.log(data);
      const daysToMilliseconds = (days) => days * 24 * 60 * 60 * 1000;
      const allWeldEvents = [];
      const allPolishEvents = [];
      const allWeaveEvents = [];

      data.forEach((e) => {
        // Package all welding events in one array
        const weldEvent = [];
        // Task ID
        weldEvent.push(`${e.order_id}_weld`);
        // Task Name
        const taskNameWeld = `${e.client_po_no} | ${e.description} x ${e.quantity}`;
        weldEvent.push(taskNameWeld);
        // Resource
        weldEvent.push('weld');
        // Start Date
        // const date1 = DateTime.toISODate(e.weld_start);
        weldEvent.push(e.weld_start);
        // End Date
        weldEvent.push(null);
        // Duration

        weldEvent.push(daysToMilliseconds(e.weld_period_days));
        // Percentage Complete
        weldEvent.push(null);
        // Dependencies
        weldEvent.push(null);
        // push weldEvent array into allWeldEvents array
        allWeldEvents.push(weldEvent);

        // Package all polishing events in one array
        const polishEvent = [];
        // Task ID
        polishEvent.push(`${e.order_id}_polish`);
        // Task Name
        const taskNamePolish = `${e.client_po_no} | ${e.description} x ${e.quantity}`;
        polishEvent.push(taskNamePolish);
        // Resource
        polishEvent.push('polish');
        // Start Date

        polishEvent.push(e.polish_start);
        // End Date
        polishEvent.push(null);
        // Duration
        polishEvent.push(daysToMilliseconds(e.polish_period_days));
        // Percentage Complete
        polishEvent.push(null);
        // Dependencies
        polishEvent.push(null);
        // push weldEvent array into allWeldEvents array
        allPolishEvents.push(polishEvent);

        // Package all polishing events in one array
        const weaveEvent = [];
        // Task ID
        weaveEvent.push(`${e.order_id}_weave`);
        // Task Name
        const taskNameWeave = `${e.client_po_no} | ${e.description} x ${e.quantity}`;
        weaveEvent.push(taskNameWeave);
        // Resource
        weaveEvent.push('weave');
        // Start Date
        weaveEvent.push(e.weave_start);
        // End Date
        weaveEvent.push(null);
        // Duration
        weaveEvent.push(daysToMilliseconds(e.weave_period_days));
        // Percentage Complete
        weaveEvent.push(null);
        // Dependencies
        weaveEvent.push(null);
        // push weaveEvent array into allWeldEvents array
        allWeaveEvents.push(weaveEvent);
      });
      const events = [...allWeldEvents, ...allPolishEvents, ...allWeaveEvents];
      // console.log(events);

      response.render('gantt-chart', { events });
    });
};

export const renderSubmission = (request, response) => {
  response.render('changes');
};

// >>>>> user authentication related <<<<< //
export const renderSignup = (request, response) => {
  response.render('signup');
};

export const postSignup = (request, response) => {
  // initialise the SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });

  // input the password from the request to the SHA object
  shaObj.update(request.body.password);

  // get the hashed password as output from the SHA object
  const hashedPassword = shaObj.getHash('HEX');

  // store hashed password in db
  const inputValue = [request.body.email, hashedPassword];
  pool
    .query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *', inputValue)
    .then((result) => {
      console.log(result.rows);
      response.redirect('/login'); })
    .catch((error) => { console.log(error); });
};

export const renderLogin = (request, response) => {
  response.render('login');
};

export const postLogin = (request, response) => {
  pool
    .query('SELECT * FROM users WHERE email = $1', [request.body.email])
    .then((result) => {
      if (result.rows.length === 0) {
        response.status(403).send('login failed');
      }

      // hash password
      const shaObjPassword = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      shaObjPassword.update(request.body.password);
      const hashedInputPassword = shaObjPassword.getHash('HEX');
      const dbPassword = result.rows[0].password;
      console.log(hashedInputPassword === dbPassword);
      if (hashedInputPassword !== dbPassword) {
        response.status(403).send('login failed');
        return;
      }

      // hash + salt cookie string
      const unhashedCookieString = `${request.body.email}-${SALT}`;
      console.log(unhashedCookieString);

      const shaObjCookie = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      shaObjCookie.update(unhashedCookieString);
      const hashedCookieString = shaObjCookie.getHash('HEX');

      response.cookie('loggedInHash', hashedCookieString);
      response.cookie('userId', result.rows[0].email);
      response.redirect('/submitted');
    });
};

export const logout = (request, response) => {
  response.clearCookie('loggedInHash');
  response.clearCookie('userId');
  response.render('logout');
};
