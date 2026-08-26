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

async function prepararBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
      estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
      estoque_minimo INTEGER NOT NULL DEFAULT 5 CHECK (estoque_minimo >= 0),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id SERIAL PRIMARY KEY,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      tipo VARCHAR(7) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      motivo VARCHAR(200),
      estoque_anterior INTEGER NOT NULL,
      estoque_posterior INTEGER NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

app.get("/", (req, res) => {
  res.json({ mensagem: "API funcionando", projeto: "Marcia Salgados" });
});

app.get("/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produtos ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

app.post("/produtos", async (req, res) => {
  try {
    const nome = String(req.body.nome || "").trim();
    const preco = Number(req.body.preco);
    const estoque = Number(req.body.estoque ?? 0);
    const estoqueMinimo = Number(req.body.estoque_minimo ?? 5);

    if (!nome || !Number.isFinite(preco) || preco < 0) {
      return res.status(400).json({ erro: "Informe um nome e um preço válido" });
    }
    if (![estoque, estoqueMinimo].every(Number.isInteger) || estoque < 0 || estoqueMinimo < 0) {
      return res.status(400).json({ erro: "Os valores de estoque devem ser inteiros positivos" });
    }

    const result = await pool.query(
      `INSERT INTO produtos (nome, preco, estoque, estoque_minimo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, preco, estoque, estoqueMinimo]
    );
    res.status(201).json({ mensagem: "Produto cadastrado", produto: result.rows[0] });
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    res.status(500).json({ erro: "Erro ao cadastrar produto" });
  }
});

app.post("/produtos/:id/movimentacoes", async (req, res) => {
  const id = Number(req.params.id);
  const tipo = String(req.body.tipo || "").toUpperCase();
  const quantidade = Number(req.body.quantidade);
  const motivo = String(req.body.motivo || "Ajuste manual").trim();

  if (!Number.isInteger(id) || !["ENTRADA", "SAIDA"].includes(tipo) || !Number.isInteger(quantidade) || quantidade <= 0) {
    return res.status(400).json({ erro: "Informe produto, tipo e quantidade válidos" });
  }

  try {
    const fator = tipo === "ENTRADA" ? quantidade : -quantidade;
    const atualizado = await pool.query(
      `UPDATE produtos
       SET estoque = estoque + $1
       WHERE id = $2 AND estoque + $1 >= 0
       RETURNING *, estoque - $1 AS estoque_anterior`,
      [fator, id]
    );

    if (atualizado.rows.length === 0) {
      const existe = await pool.query("SELECT id FROM produtos WHERE id = $1", [id]);
      return res.status(existe.rows.length ? 409 : 404).json({
        erro: existe.rows.length ? "Estoque insuficiente para esta saída" : "Produto não encontrado"
      });
    }

    const produto = atualizado.rows[0];
    const movimento = await pool.query(
      `INSERT INTO movimentacoes
       (produto_id, tipo, quantidade, motivo, estoque_anterior, estoque_posterior)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, tipo, quantidade, motivo, produto.estoque_anterior, produto.estoque]
    );
    res.status(201).json({
      mensagem: tipo === "ENTRADA" ? "Entrada registrada" : "Saída registrada",
      produto,
      movimentacao: movimento.rows[0]
    });
  } catch (error) {
    console.error("Erro ao movimentar estoque:", error);
    res.status(500).json({ erro: "Erro ao movimentar estoque" });
  }
});

app.get("/movimentacoes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.nome AS produto
      FROM movimentacoes m
      JOIN produtos p ON p.id = m.produto_id
      ORDER BY m.criado_em DESC, m.id DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    res.status(500).json({ erro: "Erro ao buscar movimentações" });
  }
});

async function iniciar() {
  await prepararBanco();
  const porta = Number(process.env.PORT) || 3000;
  return app.listen(porta, "0.0.0.0", () => console.log(`Backend rodando na porta ${porta}`));
}

if (require.main === module) {
  iniciar().catch(error => {
    console.error("Não foi possível iniciar o backend:", error);
    process.exit(1);
  });
}

module.exports = { app, pool, prepararBanco, iniciar };
