const API = "/api";

const lista = document.getElementById("lista");
const statusElement = document.getElementById("status");
const form = document.getElementById("produtoForm");
const mensagem = document.getElementById("mensagem");

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = String(texto ?? "");
  return div.innerHTML;
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(valor) {
  if (!valor) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(valor));
}

async function movimentarEstoque(produtoId, formulario) {
  const retorno = formulario.querySelector(".movement-message");
  const dados = Object.fromEntries(new FormData(formulario));
  dados.produto_id = produtoId;
  dados.quantidade = Number(dados.quantidade);

  try {
    const response = await fetch(API + "/estoque/movimentacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.erro || "Erro ao movimentar estoque");

    retorno.textContent = `Movimentação concluída. Novo estoque: ${resultado.estoque_atual}.`;
    retorno.className = "movement-message success";
    formulario.reset();
    await Promise.all([carregarProdutos(), carregarHistorico()]);
  } catch (error) {
    retorno.textContent = error.message;
    retorno.className = "movement-message error";
  }
}

async function carregarProdutos() {
  try {
    const response = await fetch(`${API}/produtos`);
    if (!response.ok) throw new Error("Erro ao consultar API");

    const produtos = await response.json();
    lista.innerHTML = "";
    document.getElementById("totalProdutos").textContent = produtos.length;

    const estoqueTotal = produtos.reduce((total, produto) => total + Number(produto.estoque), 0);
    const estoqueBaixo = produtos.filter(produto => Number(produto.estoque) <= Number(produto.estoque_minimo));

    document.getElementById("estoqueTotal").textContent = estoqueTotal;
    document.getElementById("estoqueBaixo").textContent = estoqueBaixo.length;

    if (produtos.length === 0) {
      statusElement.textContent = "Nenhum produto cadastrado";
      lista.innerHTML = `
        <div class="empty-state">
          <span aria-hidden="true">+</span>
          <strong>Seu catálogo está vazio</strong>
          <p>Cadastre o primeiro produto para começar a controlar o estoque.</p>
          <a href="#cadastro" class="button primary">Cadastrar produto</a>
        </div>
      `;
      return;
    }

    statusElement.textContent = `${produtos.length} ${produtos.length === 1 ? "produto cadastrado" : "produtos cadastrados"}`;

    produtos.forEach(produto => {
      const estoqueBaixo = Number(produto.estoque) <= Number(produto.estoque_minimo);
      const card = document.createElement("article");
      card.className = "product";
      card.innerHTML = `
        <div class="product-content">
          <div class="product-topline">
            <h3>${escapar(produto.nome)}</h3>
            <span class="stock-badge ${estoqueBaixo ? "low" : ""}">${estoqueBaixo ? "Estoque baixo" : "Disponível"}</span>
          </div>
          <div class="price">${formatarMoeda(produto.preco)}</div>
          <div class="stock-info">
            <div><span>Em estoque</span><strong>${produto.estoque}</strong></div>
            <div><span>Mínimo</span><strong>${produto.estoque_minimo}</strong></div>
          </div>
        </div>
        <form class="movement-form">
          <label>Movimentar estoque</label>
          <div class="movement-grid">
            <select name="tipo" aria-label="Tipo de movimentação">
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
            <input name="quantidade" type="number" min="1" value="1" required aria-label="Quantidade">
          </div>
          <input name="motivo" maxlength="200" placeholder="Motivo: venda, produção..." aria-label="Motivo da movimentação">
          <button class="button primary" type="submit">Confirmar movimentação</button>
          <p class="movement-message" aria-live="polite"></p>
        </form>
      `;

      card.querySelector(".movement-form").addEventListener("submit", event => {
        event.preventDefault();
        movimentarEstoque(produto.id, event.currentTarget);
      });
      lista.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    statusElement.textContent = "Não foi possível conectar com o backend.";
  }
}

async function carregarHistorico() {
  const container = document.getElementById("historicoLista");
  try {
    const response = await fetch(`${API}/movimentacoes`);
    if (!response.ok) throw new Error();

    const movimentacoes = await response.json();
    container.innerHTML = "";

    if (movimentacoes.length === 0) {
      container.innerHTML = `
        <div class="empty-state compact">
          <strong>Nenhuma movimentação registrada</strong>
          <p>As entradas e saídas aparecerão aqui.</p>
        </div>
      `;
      return;
    }

    movimentacoes.forEach(mov => {
      const div = document.createElement("div");
      div.className = "history-item";
      const entrada = mov.tipo === "ENTRADA";
      const tipoClasse = entrada ? "entry" : "exit";
      div.innerHTML = `
        <div class="history-product">
          <span class="history-symbol" aria-hidden="true">${entrada ? "+" : "−"}</span>
          <div>
            <strong>${escapar(mov.produto)}</strong>
            <p>${escapar(mov.motivo || "Sem motivo informado")}</p>
            <small>${formatarData(mov.criado_em)}${mov.pedido_id ? ` · Pedido #${mov.pedido_id}` : ""}</small>
          </div>
        </div>
        <div class="movement-summary ${tipoClasse}">
          <strong>${entrada ? "Entrada" : "Saída"} de ${mov.quantidade}</strong>
          <p>${mov.quantidade === 1 ? "unidade" : "unidades"}</p>
          <small>${mov.estoque_anterior} → ${mov.estoque_posterior}</small>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    container.textContent = "Erro ao carregar histórico.";
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const dados = {
    nome: document.getElementById("nome").value,
    preco: Number(document.getElementById("preco").value),
    estoque: Number(document.getElementById("estoque").value),
    estoque_minimo: Number(document.getElementById("estoque_minimo").value)
  };

  try {
    const response = await fetch(`${API}/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const resultado = await response.json();
    if (!response.ok) throw new Error(resultado.erro || "Erro ao cadastrar");

    mensagem.textContent = "Produto cadastrado com sucesso!";
    mensagem.className = "success";
    form.reset();
    await Promise.all([carregarProdutos(), carregarHistorico()]);
  } catch (error) {
    mensagem.textContent = error.message;
    mensagem.className = "error";
  }
});

carregarProdutos();
carregarHistorico();
