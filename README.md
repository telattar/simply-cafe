# Simply Cafe ☕

A simple server-side application of a coffeeshop management system. This project demonstrates the implementation of various backend functionalities including user authentication, product management, and order processing.

Prepare a cup of coffee, before you read the rest of this file 😄.

## Tech Used

![Node.js](https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

## Features

#### User Authentication

Secure user registration and login functionality. **How?**

- [Bcrypt](https://www.npmjs.com/package/bcrypt) is used to salt and hash the password during signup instead of using other encryption techniques.
- Each authenticated user is given a signed JWT token at login.
- User roles are checked at each endpoint to make sure users are **authorized** to do a specific action.

#### Product Management and Order Processing

CRUD operations for managing coffee shop products and handling customer orders, including order creation, updating, and deletion. Please refer to the API Endpoints section for more information.

#### Integration Testing

Comprehensive tests using Jest and Supertest.

## API Endpoints Summary

For input/output details, refer to the description embedded above each function in any file inside the `controller` directiory.

| Endpoint               | Method | Description                               |
| ---------------------- | ------ | ----------------------------------------- |
| /login                 | POST   | Logs in an existing user                  |
| /signUp                | POST   | Registers a new user                      |
| /logout                | POST   | Logs out the currently logged-in user     |
| /item                  | POST   | Creates a new item                        |
| /item/:id              | GET    | Retrieves details of a specific item      |
| /item/:id              | PATCH  | Updates details of a specific item        |
| /item/:id              | DELETE | Deletes a specific item                   |
| /bundle                | POST   | Creates a new bundle                      |
| /bundle/:id            | GET    | Retrieves details of a specific bundle    |
| /bundle/:id            | PATCH  | Updates details of a specific bundle      |
| /bundle/:id            | DELETE | Deletes a specific bundle                 |
| /menu/item             | POST   | Adds an item to the menu                  |
| /menu/bundle           | POST   | Adds a bundle to the menu                 |
| /menu                  | GET    | Retrieves the entire menu                 |
| /menu/item/:id/stock   | PATCH  | Updates the stock of an item in the menu  |
| /menu/bundle/:id/stock | PATCH  | Updates the stock of a bundle in the menu |
| /menu/item/:id         | DELETE | Removes an item from the menu             |
| /menu/bundle/:id       | DELETE | Removes a bundle from the menu            |
| /order                 | POST   | Creates a new order                       |
| /order/:id             | GET    | Retrieves details of a customer's order   |
| /order/:id/cancel      | PATCH  | Cancels a customer's order                |
| /order/:id/complete    | PATCH  | Marks an order as complete                |

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/telattar/simply-cafe.git
   cd simply-cafe
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and add the variables provided in the `.env.sample` file. More details in the file itself.

4. **Run the application**:

   ```bash
   npm start
   ```

5. **Run tests**: please make sure your terminal is at `src` directory.
   ```bash
   npx jest --node-options=--experimental-vm-modules --detectOpenHandles --verbose src/tests/TESTFILENAME.js
   ```
