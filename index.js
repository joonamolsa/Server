require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

// oma tietokantayhteys
let pool;
(async () => {
  pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
})();

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// CONTACTS  GET /api/contacts
app.get("/api/contacts", async (req, res) => {
  const { q, name, phone, city } = req.query;
  const where = [],
    params = [];
  if (q) {
    where.push("(name LIKE ? OR phone LIKE ? OR city LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (name) {
    where.push("name LIKE ?");
    params.push(`%${name}%`);
  }
  if (phone) {
    where.push("phone LIKE ?");
    params.push(`%${phone}%`);
  }
  if (city) {
    where.push("city LIKE ?");
    params.push(`%${city}%`);
  }
  const sql = `SELECT * FROM contacts ${
    where.length ? "WHERE " + where.join(" AND ") : ""
  } ORDER BY id DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// CONTACTS POST /api/contacts
app.post("/api/contacts", async (req, res) => {
  const { name, phone, city } = req.body; // ← lisää city
  if (!name || !phone)
    return res.status(400).json({ error: "name and phone required" });
  try {
    const [r] = await pool.execute(
      "INSERT INTO contacts (name, phone, city) VALUES (?, ?, ?)",
      [name, phone, city ?? null]
    );
    const [rows] = await pool.query("SELECT * FROM contacts WHERE id=?", [
      r.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CONTACTS PUT /api/contacts/:id
app.put("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, city } = req.body; // ← lisää city
  if (!name || !phone)
    return res.status(400).json({ error: "name and phone required" });
  try {
    await pool.execute(
      "UPDATE contacts SET name=?, phone=?, city=? WHERE id=?",
      [name, phone, city ?? null, id]
    );
    const [rows] = await pool.query("SELECT * FROM contacts WHERE id=?", [id]);
    if (!rows[0]) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CONTACTS DELETE /api/contacts/:id
app.delete("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await pool.execute("DELETE FROM contacts WHERE id=?", [id]);
    if (r.affectedRows === 0)
      return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// COMPANIES  GET /api/companies
app.get("/api/companies", async (req, res) => {
  const { q, name, phone, city } = req.query;
  const where = [],
    params = [];
  if (q) {
    where.push("(name LIKE ? OR phone LIKE ? OR city LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (name) {
    where.push("name LIKE ?");
    params.push(`%${name}%`);
  }
  if (phone) {
    where.push("phone LIKE ?");
    params.push(`%${phone}%`);
  }
  if (city) {
    where.push("city LIKE ?");
    params.push(`%${city}%`);
  }
  const sql = `SELECT * FROM companies ${
    where.length ? "WHERE " + where.join(" AND ") : ""
  } ORDER BY id DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// COMPANIES POST /api/companies
app.post("/api/companies", async (req, res) => {
  const { name, phone, city } = req.body;
  if (!name || !phone)
    return res.status(400).json({ error: "name and phone required" });
  const [r] = await pool.execute(
    "INSERT INTO companies (name, phone, city) VALUES (?, ?, ?)",
    [name, phone, city ?? null]
  );
  const [rows] = await pool.query("SELECT * FROM companies WHERE id=?", [
    r.insertId,
  ]);
  res.status(201).json(rows[0]);
});

// COMPANIES PUT /api/companies/:id
app.put("/api/companies/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, city } = req.body;
  await pool.execute(
    "UPDATE companies SET name=?, phone=?, city=? WHERE id=?",
    [name, phone, city ?? null, id]
  );
  const [rows] = await pool.query("SELECT * FROM companies WHERE id=?", [id]);
  if (!rows[0]) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});
app.delete("/api/companies/:id", async (req, res) => {
  const { id } = req.params;
  const [r] = await pool.execute("DELETE FROM companies WHERE id=?", [id]);
  if (!r.affectedRows) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

// YELLOW PAGES GET /api/yellow-pages
app.get("/api/yellow-pages", async (req, res) => {
  try {
    const { item_name, city, price_min, price_max, phone, q } = req.query;
    const where = [],
      params = [];
    const like = (v) => `%${v}%`;

    if (item_name) {
      where.push("item_name LIKE ?");
      params.push(like(item_name));
    }
    if (city) {
      where.push("city LIKE ?");
      params.push(like(city));
    }
    if (phone) {
      where.push("phone LIKE ?");
      params.push(like(phone));
    }

    const toNum = (v) => {
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };
    const pmin = toNum(price_min),
      pmax = toNum(price_max);
    if (pmin !== null) {
      where.push("price >= ?");
      params.push(pmin);
    }
    if (pmax !== null) {
      where.push("price <= ?");
      params.push(pmax);
    }

    if (q) {
      const L = like(q);
      where.push(
        "(item_name LIKE ? OR description LIKE ? OR city LIKE ? OR phone LIKE ?)"
      );
      params.push(L, L, L, L);
    }

    const sql = `SELECT * FROM yellow_pages ${
      where.length ? "WHERE " + where.join(" AND ") : ""
    } ORDER BY id DESC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/yellow-pages ERR", e);
    res.status(500).json({ error: e.message });
  }
});

// YELLOW PAGES POST /api/yellow-pages
app.post("/api/yellow-pages", async (req, res) => {
  const { item_name, description, price, city, phone, posted_date, image_url } =
    req.body;
  if (!item_name || price == null)
    return res.status(400).json({ error: "item_name and price required" });

  const dateVal = isDate(posted_date) ? posted_date : null;

  const [r] = await pool.execute(
    `INSERT INTO yellow_pages (item_name, description, price, phone, city, posted_date, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item_name,
      description ?? null,
      price,
      phone ?? null,
      city ?? null,
      dateVal,
      image_url ?? null,
    ]
  );
  const [rows] = await pool.query("SELECT * FROM yellow_pages WHERE id=?", [
    r.insertId,
  ]);
  res.status(201).json(rows[0]);
});

// YELLOW PAGES PUT /api/yellow-pages/:id
app.put("/api/yellow-pages/:id", async (req, res) => {
  const { id } = req.params;
  const { item_name, description, price, city, phone, posted_date, image_url } =
    req.body;

  const dateVal = isDate(posted_date) ? posted_date : null;

  await pool.execute(
    `UPDATE yellow_pages
     SET item_name=?, description=?, price=?, phone=?, city=?, posted_date=?, image_url=?
     WHERE id=?`,
    [
      item_name,
      description ?? null,
      price,
      phone ?? null,
      city ?? null,
      dateVal,
      image_url ?? null,
      id,
    ]
  );
  const [rows] = await pool.query("SELECT * FROM yellow_pages WHERE id=?", [
    id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});

// YELLOW PAGES DELETE /api/yellow-pages/:id
app.delete("/api/yellow-pages/:id", async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return res.status(400).json({ error: "invalid id" });
  }
  try {
    const [r] = await pool.execute("DELETE FROM yellow_pages WHERE id=?", [
      idNum,
    ]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: "not found" });
    }
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API http://localhost:${port}`));
