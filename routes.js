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

// render form page for adding PO
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

export const renderProductForm = (request, response) => {
  pool
    .query('SELECT * FROM buyers')
    .then((result) => {
      const buyerList = result.rows;
      console.log(result.rows);
      response.render('input-product', { buyerList });
    });
};

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
          .query('SELECT products.id, description, weld_counter, polish_counter, weave_counter, buyers.buyer_name FROM products INNER JOIN buyers ON products.buyer_id = buyers.id WHERE products.buyer_id = $1 ORDER BY description ASC', inputValue)
          .then((result) => {
            const allProducts = result.rows;
            console.log(result.rows);
            response.render('all-products', { allProducts, buyerList });
          })
          .catch((error) => console.log(error));
      }
    });
};

// render single product page
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

export const renderProductEditForm = (request, response) => {
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
};

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

export const deleteProduct = (request, response) => {
  const { id } = request.params;
  pool.query('DELETE FROM products WHERE id = $1', [id])
    .then((result) => {
      response.redirect('/submitted');
    })
    .catch((error) => console.log(error));
};

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

export const renderChangesPage = (request, response) => {
  response.render('changes-received');
};

export const renderAddSchedule = (request, response) => {
  const sqlQueryFilterBuyer = 'SELECT * FROM buyers';
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
        pool.query(`SELECT client_po_no FROM orders INNER JOIN products ON orders.product_id = products.id INNER JOIN buyers ON products.buyer_id = buyers.id WHERE products.buyer_id=${Number(request.query.buyer_id)}`)
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
                  console.log('data');
                  console.log(data);
                  response.render('add-schedule', { buyerList, poList, data });
                })
                .catch((err2) => { console.log(err2); });
            }
          });
      }
    }); };

export const postSchedule = (request, response) => {
  console.log(request.body);
  const data = request.body;
  // repackaging data from request.body so that it's easy to input
  const newData = [];
  const keysArray = Object.keys(data);
  const valuesArray = Object.values(data);
  // this loop is what I'm proudest of in this whole project
  for (let i = 0; i < valuesArray[0].length; i += 1) {
    const newObj = {};
    for (let j = 0; j < keysArray.length; j += 1) {
      newObj[keysArray[j]] = valuesArray[j][i];
    }
    newData.push(newObj);
  }
  console.log(newData);

  newData.forEach((obj) => {
    const inputData = [obj.order_id, obj.product_id, obj.weld_start, obj.weld_period_days, obj.polish_start, obj.polish_period_days, obj.weave_start, obj.weave_period_days];
    const sqlQuery = 'INSERT INTO schedule (order_id, product_id, weld_start, weld_period_days, polish_start, polish_period_days, weave_start, weave_period_days) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
    pool
      .query(sqlQuery, inputData)
      .then((result) => {
        console.table(result.rows);
        response.redirect('/submitted');
      });
  });
};

export const renderCalendar = (request, response) => {
  const sqlQuery = 'SELECT order_id, orders.client_po_no, orders.quantity, weld_start, weld_period_days, polish_start, polish_period_days, weave_start, weave_period_days, products.description   FROM schedule INNER JOIN products ON schedule.product_id = products.id INNER JOIN orders ON schedule.order_id = orders.id';
  pool
    .query(sqlQuery)
    .then((result) => {
      const data = result.rows;

      // calculate end dates for each station schedule
      const events = [];

      data.forEach((e) => {
        // get weld end date
        const weldStart = new Date(e.weld_start);
        weldStart.setDate(weldStart.getDate() + Number(e.weld_period_days));
        // add weld end date to data
        e.weld_end = weldStart;

        // get polish end date
        const polishStart = new Date(e.polish_start);
        polishStart.setDate(polishStart.getDate() + Number(e.polish_period_days));
        // add polish end date to data
        e.polish_end = polishStart;

        // get weave end date
        const weaveStart = new Date(e.weave_start);
        weaveStart.setDate(weaveStart.getDate() + Number(e.weave_period_days));
        // add weave end date to data
        e.weave_end = weaveStart;

        // package event
        const weldEvent = {};
        weldEvent.title = `${e.client_po_no} | ${e.description} X ${e.quantity} | weld`;
        weldEvent.start = e.weld_start;
        weldEvent.end = e.weld_end;
        weldEvent.allDay = true;
        events.push(weldEvent);

        const polishEvent = {};
        polishEvent.title = `${e.client_po_no} | ${e.description} X ${e.quantity} | polish`;
        polishEvent.start = e.polish_start;
        polishEvent.end = e.polish_end;
        polishEvent.allDay = true;
        events.push(polishEvent);

        const weaveEvent = {};
        weaveEvent.title = `${e.client_po_no} | ${e.description} X ${e.quantity} | weave`;
        weaveEvent.start = e.weave_start;
        weaveEvent.end = e.weave_end;
        weaveEvent.allDay = true;
        events.push(weaveEvent);
      });
      console.log(events);

      response.render('visualise-schedule', { data, events });
    });
};

export const renderSubmission = (request, response) => {
  response.render('changes');
};
