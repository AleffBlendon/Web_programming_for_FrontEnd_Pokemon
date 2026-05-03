/**********************************************************************************************************************************
 * Objetivo: Implementar a lógica da aplicação, consumindo a PokeAPI e manipulando o DOM.                                         *
 * Funcionalidades:                                                                                                               *
 * - Busca por nome, tipo e número da Pokédex (#ID)                                                                               *
 * - Consumo de API com fetch                                                                                                     *
 * - Sistema de favoritos com LocalStorage                                                                                        *
 * - Controle de requisições com debounce                                                                                         *
 * Tecnologias: JavaScript (ES6+)                                                                                                 *
 * API utilizada: https://pokeapi.co/                                                                                             *
 * Autor: Aleff Blendon Costa                                                                                                     *
 * Data: 03/05/2026                                                                                                               *
 * Versão: 1.0                                                                                                                    *
 *********************************************************************************************************************************/

'use strict';

// ── Constantes ────────────────────────────────────────────
const BASE_URL      = 'https://pokeapi.co/api/v2';
const PAGE_SIZE     = 20;
const LS_KEY        = 'pokedex_favorites';

// ── Estado da aplicação ───────────────────────────────────
const state = {
  offset: 0,
  currentQuery: '',
  isTypeSearch: false,
  isLoading: false,
  showingFavorites: false,
  favorites: loadFavorites(),
};

// ── Elementos do DOM ──────────────────────────────────────
const grid          = document.getElementById('pokemonGrid');
const statusMsg     = document.getElementById('statusMsg');
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const favBtn        = document.getElementById('favBtn');
const loadMoreBtn   = document.getElementById('loadMoreBtn');
const loadMoreWrap  = document.getElementById('loadMoreWrapper');

// ── LocalStorage helpers ──────────────────────────────────
function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(LS_KEY, JSON.stringify([...state.favorites]));
}

function isFavorite(id) {
  return state.favorites.has(id);
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  saveFavorites();
}

// ── Fetch helpers ─────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Busca dados completos de um Pokémon pelo nome ou ID.
 * Retorna null se não encontrado.
 */
async function fetchPokemon(nameOrId) {
  try {
    return await fetchJSON(`${BASE_URL}/pokemon/${nameOrId}`);
  } catch {
    return null;
  }
}

/**
 * Busca lista paginada de Pokémons (página inicial / load more).
 */
async function fetchPokemonList(offset, limit) {
  const data = await fetchJSON(
    `${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`
  );
  return data.results; // [{ name, url }]
}

/**
 * Busca todos os Pokémons de um tipo.
 */
async function fetchPokemonByType(type) {
  const data = await fetchJSON(`${BASE_URL}/type/${type}`);
  // data.pokemon é um array de { pokemon: { name, url }, slot }
  return data.pokemon.map((p) => p.pokemon);
}

// ── Extrai habilidade passiva (hidden ability ou primeira) ─
function getPassiveAbility(pokemon) {
  const hidden = pokemon.abilities.find((a) => a.is_hidden);
  const ability = hidden || pokemon.abilities[0];
  return ability ? ability.ability.name.replace(/-/g, ' ') : '—';
}

// ── Número formatado da Pokédex ───────────────────────────
function formatPokedexNumber(id) {
  return `#${String(id).padStart(3, '0')}`;
}

// ── Cria o HTML de um card ────────────────────────────────
function createCardHTML(pokemon) {
  const id       = pokemon.id;
  const name     = pokemon.name;
  const imgSrc   = pokemon.sprites?.other?.['official-artwork']?.front_default
                || pokemon.sprites?.front_default
                || '';
  const types    = pokemon.types.map((t) => t.type.name);
  const passive  = getPassiveAbility(pokemon);
  const pokedexN = formatPokedexNumber(id);
  const fav      = isFavorite(id);

  const typeBadges = types
    .map((t) => `<span class="type-badge type-${t}">${t}</span>`)
    .join('');

  return `
    <article class="card" data-id="${id}">
      <button
        class="card__fav ${fav ? 'active' : ''}"
        aria-label="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
        data-fav-id="${id}"
        title="${fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
            a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
            1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <h2 class="card__name">${name}</h2>

      <div class="card__img-wrapper">
        ${imgSrc
          ? `<img class="card__img" src="${imgSrc}" alt="${name}" loading="lazy" />`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
               viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
               <rect x="3" y="3" width="18" height="18" rx="2"/>
               <circle cx="8.5" cy="8.5" r="1.5"/>
               <polyline points="21 15 16 10 5 21"/>
             </svg>`
        }
      </div>

      <div class="card__info">
        <div class="card__info-row">
          <span class="card__info-label">Nº</span>
          <span>${pokedexN}</span>
        </div>
        <div class="card__info-row">
          <span class="card__info-label">Tipo:</span>
          <div class="card__types">${typeBadges}</div>
        </div>
        <div class="card__info-row">
          <span class="card__info-label">Passiva:</span>
          <span style="text-transform:capitalize">${passive}</span>
        </div>
      </div>
    </article>
  `;
}

// ── Skeleton loaders ──────────────────────────────────────
function renderSkeletons(count = PAGE_SIZE) {
  const html = Array.from({ length: count }, () => `
    <div class="skeleton" aria-hidden="true">
      <div class="skeleton__line skeleton__line--title"></div>
      <div class="skeleton__img"></div>
      <div class="skeleton__line skeleton__line--lg"></div>
      <div class="skeleton__line skeleton__line--md"></div>
      <div class="skeleton__line skeleton__line--sm"></div>
    </div>
  `).join('');
  grid.insertAdjacentHTML('beforeend', html);
}

function removeSkeletons() {
  grid.querySelectorAll('.skeleton').forEach((el) => el.remove());
}

// ── Renderiza cards no grid ───────────────────────────────
function renderCards(pokemonList) {
  const html = pokemonList.map(createCardHTML).join('');
  grid.insertAdjacentHTML('beforeend', html);
}

// ── Atualiza estado visual do botão de favorito ───────────
function updateFavButton(btn, id) {
  const active = isFavorite(id);
  btn.classList.toggle('active', active);
  btn.setAttribute(
    'aria-label',
    active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
  );
  btn.setAttribute(
    'title',
    active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
  );
}

// ── Delegação de eventos no grid (favoritos) ──────────────
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-fav-id]');
  if (!btn) return;

  const id = Number(btn.dataset.favId);
  toggleFavorite(id);
  updateFavButton(btn, id);

  // Se estiver na view de favoritos e desmarcar, remove o card
  if (state.showingFavorites && !isFavorite(id)) {
    btn.closest('.card')?.remove();
    if (!grid.querySelector('.card')) {
      setStatus('Nenhum favorito salvo ainda.', false);
    }
  }
});

// ── Mensagem de status ────────────────────────────────────
function setStatus(msg, isError = false) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg' + (isError ? ' error' : '');
}

// ── Controla visibilidade do botão "Carregar mais" ────────
function setLoadMoreVisible(visible) {
  loadMoreWrap.style.display = visible ? 'flex' : 'none';
}

// ── Carrega lista inicial / paginada ──────────────────────
async function loadDefaultList(reset = false) {
  if (state.isLoading) return;
  state.isLoading = true;
  state.isTypeSearch = false;
  state.currentQuery = '';

  if (reset) {
    grid.innerHTML = '';
    state.offset = 0;
  }

  loadMoreBtn.disabled = true;
  renderSkeletons(PAGE_SIZE);
  setStatus('');

  try {
    const results = await fetchPokemonList(state.offset, PAGE_SIZE);
    removeSkeletons();

    if (results.length === 0) {
      setStatus('Nenhum Pokémon encontrado.');
      setLoadMoreVisible(false);
      return;
    }

    // Busca detalhes em paralelo
    const details = await Promise.all(
      results.map((r) => fetchPokemon(r.name))
    );
    const valid = details.filter(Boolean);
    renderCards(valid);

    state.offset += results.length;
    setLoadMoreVisible(results.length === PAGE_SIZE);
  } catch (err) {
    removeSkeletons();
    setStatus('Erro ao carregar Pokémons. Tente novamente.', true);
    console.error(err);
  } finally {
    state.isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// ── Cache da lista completa (carregado uma única vez) ─────
let allPokemonNames = null; // [{ name, url }]

async function getAllPokemonNames() {
  if (allPokemonNames) return allPokemonNames;
  const data = await fetchJSON(`${BASE_URL}/pokemon?limit=1000`);
  allPokemonNames = data.results; // [{ name, url }]
  return allPokemonNames;
}

// ── Busca por prefixo ─────────────────────────────────────
async function searchByPrefix(prefix) {
  if (state.isLoading) return;
  state.isLoading = true;
  state.isTypeSearch = false;

  grid.innerHTML = '';
  setLoadMoreVisible(false);
  setStatus('Buscando…');

  try {
    const all = await getAllPokemonNames();
    const query = prefix.toLowerCase().trim();
    const matches = all.filter((p) => p.name.toLowerCase().startsWith(query));

    if (matches.length === 0) {
      setStatus('Nenhum Pokémon encontrado.', true);
      return;
    }

    // Exibe skeletons proporcionais (máx PAGE_SIZE para não travar a UI)
    const firstSlice = matches.slice(0, PAGE_SIZE);
    renderSkeletons(firstSlice.length);

    const details = await Promise.all(
      firstSlice.map((r) => fetchPokemon(r.name))
    );
    removeSkeletons();
    const valid = details.filter(Boolean);
    renderCards(valid);

    setStatus(`${matches.length} Pokémon(s) encontrado(s) para "${prefix}".`);

    // Guarda o restante para "carregar mais"
    state.prefixRemainder = matches.slice(PAGE_SIZE);
    state.isPrefixSearch  = true;
    setLoadMoreVisible(state.prefixRemainder.length > 0);
  } catch (err) {
    removeSkeletons();
    setStatus('Erro na busca. Tente novamente.', true);
    console.error(err);
  } finally {
    state.isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// ── Carregar mais (prefixo) ───────────────────────────────
async function loadMoreByPrefix() {
  if (state.isLoading || !state.prefixRemainder?.length) return;
  state.isLoading = true;
  loadMoreBtn.disabled = true;

  const slice = state.prefixRemainder.splice(0, PAGE_SIZE);
  renderSkeletons(slice.length);

  try {
    const details = await Promise.all(slice.map((r) => fetchPokemon(r.name)));
    removeSkeletons();
    renderCards(details.filter(Boolean));
    setLoadMoreVisible(state.prefixRemainder.length > 0);
  } catch (err) {
    removeSkeletons();
    setStatus('Erro ao carregar mais. Tente novamente.', true);
    console.error(err);
  } finally {
    state.isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// ── Busca por tipo ────────────────────────────────────────
async function searchByType(type) {
  if (state.isLoading) return;
  state.isLoading = true;
  state.isTypeSearch = true;
  state.currentQuery = type;

  grid.innerHTML = '';
  setLoadMoreVisible(false);
  renderSkeletons(PAGE_SIZE);
  setStatus('');

  try {
    const list = await fetchPokemonByType(type.toLowerCase().trim());
    removeSkeletons();

    if (!list || list.length === 0) {
      setStatus(`Nenhum Pokémon do tipo "${type}" encontrado.`, true);
      return;
    }

    setStatus(`${list.length} Pokémons do tipo "${type}" encontrados.`);

    // Carrega os primeiros PAGE_SIZE em paralelo
    const slice   = list.slice(0, PAGE_SIZE);
    const details = await Promise.all(slice.map((r) => fetchPokemon(r.name)));
    const valid   = details.filter(Boolean);
    renderCards(valid);

    // Guarda o restante para "carregar mais"
    state.typeRemainder = list.slice(PAGE_SIZE);
    setLoadMoreVisible(state.typeRemainder.length > 0);
  } catch (err) {
    removeSkeletons();
    setStatus(`Tipo "${type}" não encontrado ou erro na busca.`, true);
    console.error(err);
  } finally {
    state.isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// ── Carregar mais (tipo) ──────────────────────────────────
async function loadMoreByType() {
  if (state.isLoading || !state.typeRemainder?.length) return;
  state.isLoading = true;
  loadMoreBtn.disabled = true;

  const slice = state.typeRemainder.splice(0, PAGE_SIZE);
  renderSkeletons(slice.length);

  try {
    const details = await Promise.all(slice.map((r) => fetchPokemon(r.name)));
    removeSkeletons();
    renderCards(details.filter(Boolean));
    setLoadMoreVisible(state.typeRemainder.length > 0);
  } catch (err) {
    removeSkeletons();
    setStatus('Erro ao carregar mais. Tente novamente.', true);
    console.error(err);
  } finally {
    state.isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// ── Exibe favoritos ───────────────────────────────────────
async function showFavorites() {
  if (state.isLoading) return;
  state.isLoading = true;

  grid.innerHTML = '';
  setLoadMoreVisible(false);
  setStatus('');

  const ids = [...state.favorites];
  if (ids.length === 0) {
    setStatus('Nenhum favorito salvo ainda.');
    state.isLoading = false;
    return;
  }

  renderSkeletons(ids.length);

  try {
    const details = await Promise.all(ids.map((id) => fetchPokemon(id)));
    removeSkeletons();
    renderCards(details.filter(Boolean));
    setStatus(`${ids.length} favorito(s) encontrado(s).`);
  } catch (err) {
    removeSkeletons();
    setStatus('Erro ao carregar favoritos.', true);
    console.error(err);
  } finally {
    state.isLoading = false;
  }
}

// ── Busca por ID (ex: "#001", "#25", "#150") ─────────────
async function searchById(rawId) {
  if (state.isLoading) return;
  state.isLoading = true;
  state.isTypeSearch = false;

  grid.innerHTML = '';
  setLoadMoreVisible(false);
  renderSkeletons(1);
  setStatus('');

  // Remove "#" e zeros à esquerda, converte para número
  const id = parseInt(rawId.replace(/^#+/, ''), 10);

  if (isNaN(id) || id < 1) {
    removeSkeletons();
    setStatus('Número de Pokédex inválido.', true);
    state.isLoading = false;
    return;
  }

  try {
    const pokemon = await fetchPokemon(id);
    removeSkeletons();

    if (!pokemon) {
      setStatus(`Nenhum Pokémon encontrado para o número #${id}.`, true);
      return;
    }

    renderCards([pokemon]);
  } catch (err) {
    removeSkeletons();
    setStatus('Erro na busca. Tente novamente.', true);
    console.error(err);
  } finally {
    state.isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// ── Lógica de busca (nome ou tipo) ────────────────────────
const KNOWN_TYPES = new Set([
  'normal','fire','water','electric','grass','ice','fighting',
  'poison','ground','flying','psychic','bug','rock','ghost',
  'dragon','dark','steel','fairy',
]);

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    state.showingFavorites = false;
    state.isPrefixSearch   = false;
    favBtn.classList.remove('active');
    favBtn.setAttribute('aria-pressed', 'false');
    loadDefaultList(true);
    return;
  }

  state.showingFavorites = false;
  state.isPrefixSearch   = false;
  favBtn.classList.remove('active');
  favBtn.setAttribute('aria-pressed', 'false');

  // Busca por número da Pokédex: "#001", "#25", "001", "25"
  if (/^#?\d+$/.test(query)) {
    await searchById(query);
  } else if (KNOWN_TYPES.has(query.toLowerCase())) {
    await searchByType(query);
  } else {
    await searchByPrefix(query);
  }
}

// ── Eventos de busca: ENTER e clique no botão ─────────────
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

searchBtn.addEventListener('click', () => {
  handleSearch();
});

// ── Botão de favoritos ────────────────────────────────────
favBtn.addEventListener('click', () => {
  state.showingFavorites = !state.showingFavorites;
  state.isPrefixSearch   = false;
  favBtn.classList.toggle('active', state.showingFavorites);
  favBtn.setAttribute('aria-pressed', String(state.showingFavorites));

  if (state.showingFavorites) {
    searchInput.value = '';
    showFavorites();
  } else {
    loadDefaultList(true);
  }
});

// ── Botão "Carregar mais" ─────────────────────────────────
loadMoreBtn.addEventListener('click', () => {
  if (state.isPrefixSearch) {
    loadMoreByPrefix();
  } else if (state.isTypeSearch) {
    loadMoreByType();
  } else {
    loadDefaultList();
  }
});

// ── Logo clicável — volta à tela inicial ─────────────────
const logoBtn = document.getElementById('logoBtn');

function resetarBusca() {
  if (state.isLoading) return;

  // Limpa input e estados de filtro
  searchInput.value      = '';
  state.showingFavorites = false;
  state.isPrefixSearch   = false;
  state.isTypeSearch     = false;

  // Reseta visual do botão de favoritos
  favBtn.classList.remove('active');
  favBtn.setAttribute('aria-pressed', 'false');

  // Recarrega a lista padrão do zero
  loadDefaultList(true);
}

logoBtn.addEventListener('click', resetarBusca);

// Acessibilidade: ativa com Enter/Space (role="button" sem <button>)
logoBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    resetarBusca();
  }
});

// ── Inicialização ─────────────────────────────────────────
(function init() {
  setLoadMoreVisible(false);
  loadDefaultList(true);
})();
