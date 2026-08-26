# Marcia Salgados

Sistema de gestão e publicidade para a empresa Marcia Salgados.

## Tecnologias

- HTML
- CSS
- JavaScript
- Node.js
- Express
- PostgreSQL
- Docker
- Kubernetes
- Jest
- Supertest

## Funcionalidades

- Cadastro de produtos
- Consulta de produtos
- Controle de estoque
- Entrada de estoque
- Saída de estoque
- Cadastro de pedidos
- Baixa automática do estoque
- Histórico de movimentações
- Associação de saída ao pedido
- Alertas de estoque mínimo

## Funcionalidade principal implementada

O controle de estoque demonstra o fluxo completo pedido na atividade:

1. **Entrada:** o usuário escolhe um produto, informa se é entrada ou saída, a quantidade e o motivo.
2. **Processamento:** a API valida os dados, soma ou subtrai a quantidade e impede que o estoque fique negativo.
3. **Saída:** a tela mostra o novo saldo, atualiza os indicadores e registra a operação no histórico.

O banco e as tabelas são criados automaticamente na primeira inicialização.

## Docker

Executar:

docker compose up -d --build

Frontend:

http://localhost:8080

Backend:

http://localhost:3000

## Testes

cd backend

npm install

npm test

Os testes cobrem cadastro, consulta, entrada de estoque e bloqueio de saída sem saldo.

## Roteiro curto para o vídeo

1. Mostre rapidamente as pastas `frontend` e `backend` no GitHub.
2. Abra o sistema em `http://localhost:8080`.
3. Cadastre “Coxinha”, preço R$ 5,00, estoque inicial 10 e mínimo 5.
4. No cartão da Coxinha, registre uma entrada de 5 unidades e mostre o saldo mudar para 15.
5. Registre uma saída de 3 unidades e mostre o saldo mudar para 12 e o histórico atualizar.
6. Tente retirar 20 unidades e mostre a mensagem “Estoque insuficiente”.
7. Explique: “a entrada é o formulário, o processamento acontece na API e a saída é o saldo e o histórico atualizados”.

## Kubernetes

Construir imagens:

docker build -t msalgados-backend:1.0 ./backend

docker build -t msalgados-frontend:1.0 ./frontend

Aplicar:

kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml

Verificar:

kubectl get pods

kubectl get services

kubectl get deployments
