
var MySQL = require('./db/mysql');
var inquire = require('inquirer');
var makeTable = require('cli-table');

var userAuthority;

// Make connection
var connection = new MySQL({
  host: 'localhost',
  port: '3306',
  user: 'root',
  database: 'bamazonTwo_DB',
  password: ''
})

// Prompt for authority
inquire.prompt({
  name: 'authority',
  type: 'list',
  message: 'Please state your level of access',
  choices: ['Customer', 'Manager', 'Supervisor', 'Quit']
}).then(function (data) {
  userAuthority = data.authority;
  // If a customer
  if (userAuthority === 'Customer') {
    (function customerFlow() {
      // Select all products and render them to users
      displayInventory('SELECT * FROM products ORDER BY department_name, product_name')
        .then(function () {
          return inquire.prompt({
            name: 'item_ID',
            type: 'input',
            message: 'Please enter the ID of the item you wish to purchase [Quit with Q]'
          })
        })
        .then(function (prompt1) {
          var prompt2;
          if (prompt1.item_ID.toUpperCase() === 'Q') {
            console.log('Goodbye!');
            return connection.destroy();
          }

          return inquire.prompt({
            name: 'qty',
            type: 'input',
            message: 'How many would you like? [Quit with Q]'
          }).then(function (prompt) {
            prompt2 = prompt.qty;
            return Promise.all([prompt1, prompt2]);
          })
        })
        .then(function (data) {
          console.log(data);
          // Query DB for items with ID match
          return Promise.all([connection.query('SELECT * FROM products WHERE ?', { item_ID: data[0].item_ID }), data[1].qty]);
        })
        .then(function (matches) {
          var queryResults = matches[0][0];
          var inStock = parseInt(queryResults.stock_quantity);
          var purchaseAmt = parseInt(matches[1]);
          // Update items in DB to reflect a purchase -only if enough in stock
          if (purchaseAmt <= inStock) {
            console.log('entered')
            connection.query('UPDATE products SET ? WHERE ? ', [
              {
                stock_quantity: inStock - purchaseAmt
              },
              {
                product_name: queryResults.product_name
              }
            ]).then(function (data) {
              customerFlow();
            })
          } else {
            console.log(`Sorry, there only ${queryResults.stock_quantity} in stock. Please re-enter your order`);
            customerFlow();
          }
        }).catch(function (err) {
          console.error(err);
        })
    })();
  }
  // If a manager
  if (userAuthority === 'Manager') {
    (function managerFlow() {
      // diplay manager choices
      inquire.prompt({
        name: 'menuChoice',
        type: 'list',
        message: 'What would you like to do?',
        choices: ['View products for sale', 'View low inventory', 'Add to inventory', 'Add new product', 'Quit']
      }).then(function (data) {
        // Flow for choices picked
        // If view products
        if (data.menuChoice === 'View products for sale') {
          displayInventory('SELECT * FROM products ORDER BY department_name, product_name')
            .then(function () {
              managerFlow();
            })
        }
        // if low inventory
        if (data.menuChoice === 'View low inventory') {
          displayInventory('SELECT * FROM products WHERE stock_quantity < 5 ORDER BY department_name, product_name')
            .then(function (data) {
              managerFlow();
            })
        }
        // if add inventory
        if (data.menuChoice === 'Add to inventory') {
          connection.query('SELECT * from products')
            .then(function (products) {
              var products = products.map(function (product) {
                return product.product_name;
              });
              products.push('Quit');
              return inquire.prompt([
                {
                  name: 'item',
                  type: 'list',
                  message: 'Which product would you like to add to?',
                  choices: products
                },
                {
                  name: 'amt',
                  type: 'input',
                  message: 'How many would you like to add?'
                }
              ])
            })
            .then(function (product) {
              console.log(product);
              if (product.item === 'Quit') {
                console.log('Goodbye!');
                return connection.destroy();
              } else {
                return Promise.all([connection.query('SELECT * from PRODUCTS WHERE ?', { product_name: product.item }), product.amt])
              }
            })
            .then(function (matches) {
              var productName = matches[0][0].product_name;
              var inStock = parseInt(matches[0][0].stock_quantity);
              var addAmt = parseInt(matches[1]);
              connection.query('UPDATE products SET ? WHERE ? ', [
                {
                  stock_quantity: inStock + addAmt
                },
                {
                  product_name: productName
                }
              ]).then(function () {
                console.log(`Successfully restocked ${productName}`);
                managerFlow();
              })
            }).catch(function (err) {
              console.error(err);
            })
        }
        // if new product
        if (data.menuChoice === 'Add new product') {
          inquire.prompt([
            {
              name: 'product_name',
              type: 'input',
              message: 'What is the product name?'
            },
            {
              name: 'department_name',
              type: 'input',
              message: 'What department does this belong to?'
            },
            {
              name: 'price',
              type: 'input',
              message: 'What is the item price?'
            },
            {
              name: 'qty',
              type: 'input',
              message: 'How many are being added?'
            }
          ]).then(function (data) {
            var { product_name, department_name, price, qty } = data;
            return Promise.all([
              connection.query('INSERT INTO products SET ?', {
                product_name,
                department_name,
                price,
                stock_quantity: qty
              }), 
              product_name
            ]).then(function (data) {
              console.log(`Successfully added ${data[1]} to the inventory`);
              managerFlow();
            })
          }).catch(function (err) {
            console.error(err);
          })
        }
        // if quit
        if (data.menuChoice === 'Quit') {
          console.log('Good bye!')
          connection.end();
        }
      })
    })()
  }
  if (userAuthority === 'Supervisor') {

  }
  if (userAuthority === 'Quit') {
    console.log('Good bye!');
    connection.end();
  }
})

function displayInventory(str) {
  return connection.query(str)
    .then(function (rows) {
      var table = new makeTable({
        head: ['ID', 'Product', 'Department', 'Price', 'Stock'],
        colWidths: [10, 40, 20, 15, 15]
      });
      rows.forEach(function (e) {
        table.push([e.item_ID, e.product_name, e.department_name, e.price, e.stock_quantity]);
      })
      console.log(table.toString());
    })
}