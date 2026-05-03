# 🧩 Projeto Pokémon - Consumo de API (Front-End)

## 📌 Descrição
Este projeto consiste no desenvolvimento de uma aplicação front-end que consome a **PokeAPI**, exibindo informações de Pokémons em formato de cards dinâmicos.

A aplicação permite buscar Pokémons por nome, tipo ou número da Pokédex, além de marcar favoritos.

---

## 🚀 Funcionalidades

- 🔍 Busca por:
  - Nome do Pokémon
  - Tipo (fire, water, grass, etc.)
  - Número da Pokédex (ex: #001, #25)

- 🧾 Exibição em cards contendo:
  - Nome
  - Imagem
  - Tipo(s)
  - Habilidade(s)
  - Número da Pokédex

- ❤️ Sistema de favoritos
  - Salvo no LocalStorage
  - Persistente ao recarregar

- ⚡ Otimização de requisições
  - Uso de debounce (evita chamadas excessivas à API)

- 📱 Layout responsivo

---

## 🛠️ Tecnologias Utilizadas

- HTML5  
- CSS3 (Flexbox/Grid)  
- JavaScript (ES6+)  
- Fetch API  
- LocalStorage  

---

## 🌐 API Utilizada

[PokeAPI](https://pokeapi.co/)

### Endpoints principais:
- `https://pokeapi.co/api/v2/pokemon/{nome-ou-id}`
- `https://pokeapi.co/api/v2/type/{tipo}`

---

## 📂 Estrutura do Projeto
📁 projeto
├── index.html
├── style.css
├── script.js
└── README.md

## ▶️ Como Executar
[https://aleffblendon.github.io/Web_programming_for_FrontEnd_Pokemon/]

📚 Conceitos Aplicados
Consumo de API REST
Manipulação de DOM
Programação assíncrona (fetch / then)
Armazenamento local (LocalStorage)
Responsividade
👨‍💻 Autor

Aleff Blendon Costa

📅 Data

Maio de 2026

📌 Versão

1.0
