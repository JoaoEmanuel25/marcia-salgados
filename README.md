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