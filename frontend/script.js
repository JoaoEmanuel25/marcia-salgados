const API = "/api";

const lista = document.getElementById("lista");
const statusElement = document.getElementById("status");
const form = document.getElementById("produtoForm");
const mensagem = document.getElementById("mensagem");

async function carregarProdutos() {

  try {

    const response = await fetch(`${API}/produtos`);

    if (!response.ok) {
      throw new Error("Erro ao consultar API");
    }

    const produtos = await response.json();

    lista.innerHTML = "";

    document.getElementById("totalProdutos").textContent =
      produtos.length;

    const estoqueTotal = produtos.reduce(
      (total, produto) =>
        total + Number(produto.estoque),
      0
    );

    const estoqueBaixo = produtos.filter(
      produto =>
        Number(produto.estoque) <=
        Number(produto.estoque_minimo)
    );

    document.getElementById("estoqueTotal").textContent =
      estoqueTotal;

    document.getElementById("estoqueBaixo").textContent =
      estoqueBaixo.length;

    if (produtos.length === 0) {

      statusElement.textContent =
        "Nenhum produto cadastrado.";

      return;
    }

    statusElement.textContent =
      `${produtos.length} produto(s) encontrado(s).`;

    produtos.forEach(produto => {

      const card = document.createElement("article");

      card.className = "product";

      card.innerHTML = `
        <h3>${produto.nome}</h3>

        <div class="price">
          R$ ${Number(produto.preco).toFixed(2)}
        </div>

        <div class="stock">
          Estoque:
          <strong>${produto.estoque}</strong>
        </div>

        <div class="stock">
          Estoque mínimo:
          ${produto.estoque_minimo}
        </div>
      `;

      lista.appendChild(card);

    });

  } catch (error) {

    console.error(error);

    statusElement.textContent =
      "Não foi possível conectar com o backend.";
  }
}

async function carregarHistorico() {

  const container =
    document.getElementById("historicoLista");

  try {

    const response =
      await fetch(`${API}/movimentacoes`);

    if (!response.ok) {
      throw new Error();
    }

    const movimentacoes =
      await response.json();

    container.innerHTML = "";

    if (movimentacoes.length === 0) {

      container.textContent =
        "Nenhuma movimentação registrada.";

      return;
    }

    movimentacoes.forEach(mov => {

      const div =
        document.createElement("div");

      div.className =
        "history-item";

      const tipoClasse =
        mov.tipo === "ENTRADA"
          ? "entry"
          : "exit";

      div.innerHTML = `
        <div>
          <strong>${mov.produto}</strong>

          <div>
            ${mov.motivo || ""}
          </div>

          ${
            mov.pedido_id
              ? `<small>Pedido #${mov.pedido_id}</small>`
              : ""
          }
        </div>

        <div class="${tipoClasse}">
          <strong>
            ${mov.tipo}
          </strong>

          <div>
            ${mov.quantidade} unidade(s)
          </div>

          <small>
            ${mov.estoque_anterior}
            →
            ${mov.estoque_posterior}
          </small>
        </div>
      `;

      container.appendChild(div);

    });

  } catch (error) {

    container.textContent =
      "Erro ao carregar histórico.";
  }
}

form.addEventListener("submit", async event => {

  event.preventDefault();

  const dados = {

    nome:
      document.getElementById("nome").value,

    preco:
      Number(
        document.getElementById("preco").value
      ),

    estoque:
      Number(
        document.getElementById("estoque").value
      ),

    estoque_minimo:
      Number(
        document.getElementById("estoque_minimo").value
      )
  };

  try {

    const response = await fetch(
      `${API}/produtos`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(dados)
      }
    );

    const resultado =
      await response.json();

    if (!response.ok) {
      throw new Error(
        resultado.erro ||
        "Erro ao cadastrar"
      );
    }

    mensagem.textContent =
      "Produto cadastrado com sucesso!";

    mensagem.style.color =
      "green";

    form.reset();

    await carregarProdutos();

  } catch (error) {

    mensagem.textContent =
      error.message;

    mensagem.style.color =
      "red";
  }

});

carregarProdutos();
carregarHistorico();