// 🔗 Integração simples com o Web App (Apps Script)

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwHlEuxm2VVj2IdeDkmivgRhUg8G9iMx5jLt12hi0_Mpq8h1-QayKVFPx6qfha_ArA/exec'; // 👈 Substitua com seu Web App publicado

// 📥 Buscar postos de trabalho
async function carregarPostos() {
  try {
    const res = await fetch(`${API_BASE_URL}?action=getPostos`);
    const postos = await res.json();
    return postos;
  } catch (error) {
    console.error('❌ Erro ao carregar postos:', error);
    return [];
  }
}

// ⚙️ Buscar configurações (spreadsheetId, botToken, etc.)
async function carregarConfig() {
  try {
    const res = await fetch(`${API_BASE_URL}?action=getConfig`);
    return await res.json();
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error);
    return {};
  }
}

// 📤 Salvar dados no histórico
async function salvarHistorico(payload) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        tipo: 'salvarHistorico',
        payload: payload
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const resultado = await res.json();
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    return { sucesso: false, erro: error.message };
  }
}
