DROP DATABASE IF EXISTS bamazonTwo_DB;
CREATE DATABASE bamazonTwo_DB;

USE bamazonTwo_DB;

CREATE TABLE products (
  item_ID INT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(30),
  department_name VARCHAR(30),
  price DECIMAL(10,2),
  stock_quantity INT,
  PRIMARY KEY (item_id)
);
