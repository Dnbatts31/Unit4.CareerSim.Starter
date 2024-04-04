const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_auth_store_db"
);
const uuid = require("uuid");
const bcrypt = require("bcrypt");

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS carts_products;
    DROP TABLE IF EXISTS carts;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS products;
    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    CREATE TABLE products(
      id UUID PRIMARY KEY,
      name VARCHAR(20),
      quantity INT DEFAULT 10
    );
    CREATE TABLE carts(
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      CONSTRAINT unique_user_id UNIQUE (user_id)
    );
    CREATE TABLE carts_products(
      id UUID PRIMARY KEY,
      carts_id UUID REFERENCES carts(id) NOT NULL,
      product_id UUID REFERENCES products(id),
      quantity INT NOT NULL 
    )
  `;
  await client.query(SQL);
};
const createUser = async ({ username, password }) => {
  const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    await bcrypt.hash(password, 5),
  ]);
  return response.rows[0];
};

const createProduct = async ({ name }) => {
  const SQL = `
    INSERT INTO products(id, name) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const createCart = async ({ user_id }) => {
  const SQL = `
    INSERT INTO carts(id, user_id) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id]);
  return response.rows[0];
};

const destroyCart = async ({ user_id, id }) => {
  const SQL = `
    DELETE FROM carts WHERE user_id=$1 AND id=$2
  `;
  await client.query(SQL, [user_id, id]);
};

const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, username FROM users WHERE username=$1;
  `;
  const response = await client.query(SQL, [username]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return { token: response.rows[0].id };
};

const findUserWithToken = async (id) => {
  const SQL = `
    SELECT id, username FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async () => {
  const SQL = `
    SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchCart = async (user_id) => {
  const SQL = `
    SELECT * FROM carts where user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};
const createCartProducts = async (cart_id, product_id, quantity) => {
  const SQL = ` INSERT INTO carts_products(id, carts_id, products_id, quantity ) VALUES($1, $2, $3, $4) RETURNING *`;
  const response = await client.query(SQL, [
    uuid.v4(),
    cart_id,
    product_id,
    quantity,
  ]);
  return response.rows;
};

//TODO: removeCartProduct 

const removeCartProduct = async (cart_id, product_id){

}

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  fetchCart,
  createCart,
  destroyCart,
  authenticate,
  findUserWithToken,
  createCartProducts,
  removeCartProduct,
};
