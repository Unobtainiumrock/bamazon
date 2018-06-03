
const MySQL = require('./db/mysql');
const inquire = require('inquirer');
const makeTable = require('cli-table');

let userAuthority;

// Make connection
const connection = new MySQL({
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
}).then(data => {
  userAuthority = data.authority;
  // If a customer
  if (userAuthority === 'Customer') {
    (function customerFlow() {
      // Select all products and render them to users
      displayInventory('SELECT item_ID, product_name, department_name, price, stock_quantity FROM products ORDER BY department_name, product_name')
        .then(() => {
          return inquire.prompt({
            name: 'item_ID',
            type: 'input',
            message: 'Please enter the ID of the item you wish to purchase [Quit with Q]'
          })
        })
        .then(prompt1 => {
          let prompt2;
          prompt1 = prompt1.item_ID;
          if (prompt1.toUpperCase() === 'Q') {
            console.log('Goodbye!');
            return connection.destroy();
          }

          return inquire.prompt({
            name: 'qty',
            type: 'input',
            message: 'How many would you like? [Quit with Q]'
          }).then(prompt => {
            prompt2 = prompt.qty;
            return Promise.all([prompt1, prompt2]);
          })
        })
        .then(data => {
          if(data[1].toUpperCase() === 'Q') {
            console.log('Goodbye!');
            return connection.destroy();
          }
          // Query DB for items with ID match
          return Promise.all([connection.query('SELECT * FROM products WHERE ?', { item_ID: data[0] }), data[1]]);
        })
        .then(matches => {
         const queryResults = matches[0][0];
         const inStock = parseInt(queryResults.stock_quantity);
         const purchaseAmt = parseInt(matches[1]);
         const price = queryResults.price;
         const productSales = queryResults.product_sales;
          // Update items in DB to reflect a purchase -only if enough in stock
          if (purchaseAmt <= inStock) {
            connection.query('UPDATE products SET ? WHERE ? ', [
              {
                stock_quantity: inStock - purchaseAmt,
                product_sales: productSales + (purchaseAmt * price)
              },
              {
                product_name: queryResults.product_name
              }
            ]).then(() => {
              customerFlow();
            })
          } else {
            console.log(`Sorry, there only ${queryResults.stock_quantity} in stock. Please re-enter your order`);
            customerFlow();
          }
        }).catch(err => {
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
      }).then(data => {
        // Flow for choices picked
        // If view products
        if (data.menuChoice === 'View products for sale') {
          displayInventory('SELECT * FROM products ORDER BY department_name, product_name')
            .then(() => {
              managerFlow();
            })
        }
        // if low inventory
        if (data.menuChoice === 'View low inventory') {
          displayInventory('SELECT * FROM products WHERE stock_quantity < 5 ORDER BY department_name, product_name')
            .then(() => {
              managerFlow();
            })
        }
        // if add inventory
        if (data.menuChoice === 'Add to inventory') {
          connection.query('SELECT * from products')
            .then(products => {
              products = products.map(product => {
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
            .then(product => {
              console.log(product);
              if (product.item === 'Quit') {
                console.log('Goodbye!');
                return connection.destroy();
              } else {
                return Promise.all([connection.query('SELECT * from PRODUCTS WHERE ?', { product_name: product.item }), product.amt])
              }
            })
            .then(matches => {
              const productName = matches[0][0].product_name;
              const inStock = parseInt(matches[0][0].stock_quantity);
              const addAmt = parseInt(matches[1]);
              connection.query('UPDATE products SET ? WHERE ? ', [
                {
                  stock_quantity: inStock + addAmt
                },
                {
                  product_name: productName
                }
              ]).then(() => {
                console.log(`Successfully restocked ${productName}`);
                managerFlow();
              })
            }).catch(err => {
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
          ]).then(data => {
            const { product_name, department_name, price, qty } = data;
            return Promise.all([
              connection.query('INSERT INTO products SET ?', {
                product_name,
                department_name,
                price,
                stock_quantity: qty,
                product_sales: 0
              }), 
              product_name
            ]).then(data => {
              console.log(`Successfully added ${data[1]} to the inventory`);
              managerFlow();
            })
          }).catch(err => {
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
  let head = ['ID', 'Product', 'Department', 'Price', 'Stock', 'Sales'];
  let colWidths = [10, 40, 20, 15, 15, 15];
  return connection.query(str)
    .then(rows => {
      if (Object.keys(rows[0]).length < 6) {
        head.pop();
        colWidths.pop();
      }
      const table = new makeTable({
        head,
        colWidths
      });
      rows.forEach(e => {
        let data = [e.item_ID, e.product_name, e.department_name, `$${e.price}`, e.stock_quantity, `$${e.product_sales}`];
        if (head.length < 6) {
          data.pop();
        }
        table.push(data);
      })
      console.log(table.toString());
    })
}