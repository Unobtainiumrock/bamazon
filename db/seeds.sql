
INSERT INTO products (product_name,department_name,price,stock_quantity,product_sales)
VALUES ('Farley','Black Market',1,500,0),
       ('Chicken','Grocery',5,10,0),
       ('Bacon!','Grocery',9001,30,0),
       ('Pound of Opium', 'Black Market',5,800,0),
       ('Plasma Rifles', 'Black Market',500,10,0),
       ('Ivory Tusks', 'Black Market',5000,2,0),
       ('Grendades', 'Black Market',5,1000,0),
       ('One Banana','Grocery',100,1,0),
       ("Thor's Hammer",'Black Market',2,1,0),
       ("Wendy's Baconator",'Fast Food',3,900,0);


INSERT INTO departments (department_name, over_head_costs)
  VALUES ('Black Market',0),
         ('Groceries',10000),
         ('Fast Food',1000000);

SELECT * FROM products;
SELECT * FROM departments;
