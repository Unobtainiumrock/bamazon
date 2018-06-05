
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

//Start app
start();

function start() {
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
              return quit();
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
            if (data[1].toUpperCase() === 'Q') {
              return quit();
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
          choices: ['View products for sale', 'View low inventory', 'Add to inventory', 'Add new product', 'Main Menu', 'Quit']
        }).then(data => {
          // Flow for choices picked
          // If view products
          const { menuChoice } = data;
          if (menuChoice === 'View products for sale') {
            displayInventory('SELECT * FROM products ORDER BY department_name, product_name')
              .then(() => {
                managerFlow();
              })
          }
          // if low inventory
          if (menuChoice === 'View low inventory') {
            displayInventory('SELECT * FROM products WHERE stock_quantity < 5 ORDER BY department_name, product_name')
              .then(() => {
                managerFlow();
              })
          }
          // if add inventory
          if (menuChoice === 'Add to inventory') {
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
                if (product.item === 'Quit') {
                  return quit();
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
          if (menuChoice === 'Add new product') {
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
            ]).then(async data => {
              const departments = await connection.query('SELECT * from departments')
              const departmentExists = departments.find(department => {
                return department.department_name === data.department_name;
              });
              if (!departmentExists) {
                console.log("You can't add an item to a department which doesn't exist!");
                return quit();
              }

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

          if (menuChoice === 'Main Menu') {
            start();
          }

          if (menuChoice === 'Quit') {
            quit();
          }
        })
      })()
    }
    if (userAuthority === 'Supervisor') {
      (function supervisorFlow() {
        inquire.prompt({
          name: 'choice',
          type: 'list',
          message: 'What would you like to do?',
          choices: ['View product sales by department', 'Create new department', 'Main Menu', 'Quit']
        }).then((data) => {
          const { choice } = data
          if (choice === 'Create new department') {
            inquire.prompt({
              name: 'dept',
              type: 'input',
              message: 'What is the name of the department you wish to add? [Quit with Q]'
            }).then((data) => {
              let { dept } = data;
              if (dept.toUpperCase() === 'Q') {
                return quit();
              }

              return inquire.prompt({
                name: 'overhead',
                type: 'input',
                message: 'What is the deparment overhead? [Quit with Q]'
              }).then(data => {
                let { overhead } = data;
                return Promise.all([dept, overhead]);
              })
            }).then(data => {
              let [dept, overhead] = data;
              if (overhead.toUpperCase() === 'Q') {
                return quit();
              }
              return Promise.all([connection.query('INSERT INTO departments SET ?', {
                department_name: dept,
                over_head_costs: overhead
              }), dept])
            }).then(data => {
              console.log(`Successfully added the department: ${data[1]}`);
            }).then(() => {
              supervisorFlow();
            }).catch(err => {
              console.error(err);
            })
          }
          if (choice === 'View product sales by department') {
            // Screw the join query strings. Coding it from scratch is easier for me to wrap my head around
            // wasted too much time trying to get the needed join. This only took 5 minutes vs forever w/ queries
            (async () => {
              let departments = await connection.query('SELECT * FROM departments');
              let products = await connection.query('SELECT * FROM products');
                            
              // Evaluates to the format we need for our joined table
              departments = departments.map(department => {
                // convert the department object into an array of its values
                let row = Object.values(department);
                // remove the ID
                row.shift();
                // use reduce to pull the cumulative total for sales where matches are found in products
                let totalSales = products.reduce((mem, product) => {
                  if (product.department_name === department.department_name) {
                    return mem + product.product_sales;
                  } else return mem;
                }, 0);
                // push the total sales for this current department row
                row.push(totalSales);
                // push the net income to this current department row
                row.push(totalSales - row[1]);
                return row;
              });

              renderMyJoin(departments);
            })()
          }

          if (choice === 'Main Menu') {
            start();
          }

          if (choice === 'Quit') {
            quit();
          }

        })
      })()
    }
    if (userAuthority === 'Quit') {
      quit();
    }
  })
}

function displayInventory(str) {
  let head = ['ID', 'Product', 'Department', 'Price', 'Stock', 'Sales'];
  let colWidths = [10, 40, 20, 15, 15, 15];
  return connection.query(str)
    .then(rows => {
      while (Object.keys(rows[0]).length < head.length) {
        head.pop();
        colWidths.pop();
      }
      const table = new makeTable({
        head,
        colWidths
      });
      rows.forEach(e => {
        let data = [e.item_ID, e.product_name, e.department_name, `$${e.price}`, e.stock_quantity, `$${e.product_sales}`];
        while (head.length < data.length) {
          data.pop();
        }
        table.push(data);
      })
      console.log(table.toString());
    })
}

function displayDepartments(str) {
  let head = ['ID', 'Department', 'Overhead', 'Product Sales', 'Total Profit'];
  let colWidths = [15, 15, 15, 15, 15];
  return connection.query(str)
    .then(rows => {

      const table = new makeTable({
        head,
        colWidths
      });
      rows.forEach(e => {
        let data = [e.department_id, e.department_name, e.over_head_costs];
        table.push(data);
      });
      console.log(table.toString());
    })
}

function renderMyJoin(data) {
  let head = ['Department', 'Overhead', 'Product Sales', 'Total Profit'];
  let colWidths = [15, 15, 15, 15];
  const table = new makeTable({
    head,
    colWidths
  });

  data.forEach(row => {
    table.push(row);
  })

  console.log(table.toString());
}

function quit(log) {
  console.log('Goodbye!');
  return connection.destroy();
}