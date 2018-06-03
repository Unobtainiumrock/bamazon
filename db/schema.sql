DROP DATABASE IF EXISTS bamazonTwo_DB;
CREATE DATABASE bamazonTwo_DB;

USE bamazonTwo_DB;

CREATE TABLE products (
  item_ID INT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(30),
  department_name VARCHAR(30),
  price DECIMAL(10,2),
  stock_quantity INT,
  product_sales INT NOT NULL,
  PRIMARY KEY (item_id)
);

CREATE TABLE departments (
    department_id INT NOT NULL AUTO_INCREMENT,
    department_name VARCHAR(15) NOT NULL,
    over_head_costs DECIMAL(20,2) NOT NULL,
    PRIMARY KEY (department_id)
);

SELECT * FROM products;
SELECT * FROM departments;
