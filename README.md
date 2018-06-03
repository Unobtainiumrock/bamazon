# Store Inventory (Bamazon)
This is a node.js application which interacts with MySQL. It has different user-interface depending on the user's status. It can be one of three types: `Customer`, `Manager`, `Supervisor`.
* A customer can purchase items from the store
* A manager can: 
  * View products
  * View low inventory
  * Add to inventory
  * Add new product (Still have ot implement)
* A supervisor can:
  * View product sales by department
  * Create new department
<img src="demo.gif" height="375" width="600"/>

## Requirements and Setup

**Install**
* [Node](https://nodejs.org/en/download/) 
* [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
* [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

## Terminal: Getting Started How to
**Run the following commands in your terminal**

```
git clone
https://github.com/Unobtainiumrock/bamazon.git

cd liri-bot

npm install
```

## Example Commands
Each terminal command can be called without providing your own Tweet handler, movie, or song name -They will default to provided search values. Try these commands out with/without providing your own values. Make sure to be in the app root level where liri.js resides

```
node liri.js do-what-it-says

node liri.js my-tweets

node liri.js spotify-this-song

node liri.js movie-this
```

## Built With

* [Javascript](https://eloquentjavascript.net/)
* [Node](https://nodejs.org/en/)

#### Packages Used
* [mysql](https://github.com/mysqljs/mysql)
* [cli-table](https://github.com/Automattic/cli-table)
* [inquirer](https://github.com/SBoudrias/Inquirer.js)


## Authors

* **Unobtainiumrock**

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Pineapple goes well on pizza
* Cats
* Trees
* Unobtainiumrock Industries ®

