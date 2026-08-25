const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "appdb",
  port: Number(process.env.DB_PORT) || 5432
});

app.get("/", (req, res) => {
  res.json({
    mensagem: "API funcionando",
    projeto: "Marcia Salgados"
  });
});

app.get("/produtos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM produtos ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    res.status(500).json({
      erro: "Erro ao buscar produtos"
    });
  }
});

app.post("/produtos", async (req, res) => {
  try {
    const { nome, preco } = req.body;

    if (!nome || preco === undefined) {
      return res.status(400).json({
        erro: "Nome e preço são obrigatórios"
      });
    }

    const result = await pool.query(
      "INSERT INTO produtos (nome, preco) VALUES ($1, $2) RETURNING *",
      [nome, preco]
    );

    res.status(201).json({
      mensagem: "Produto cadastrado",
      produto: result.rows[0]
    });

  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);

    res.status(500).json({
      erro: "Erro ao cadastrar produto"
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando na porta ${PORT}`);
});