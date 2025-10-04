const sqlite3 = require('sqlite3').verbose();

// Función para consultar el estado actual del portal
function queryCurrentState() {
  const db = new sqlite3.Database('./prisma/dev.db', sqlite3.OPEN_READONLY);

  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, title, posicion_general, is_general
      FROM articles
      WHERE status = 'PUBLISHED' AND posicion_general IS NOT NULL
      ORDER BY posicion_general ASC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

// Función para simular llamada HTTP al endpoint de empuje
async function testPushAlgorithm() {
  console.log('🔍 Consultando estado ANTES de la corrección...');

  const beforeState = await queryCurrentState();
  console.log('Estado actual de General:');
  beforeState.forEach(article => {
    console.log(`  Posición ${article.posicion_general}: ${article.title.substring(0, 50)}...`);
  });

  console.log(`\n📊 Total artículos: ${beforeState.length}`);

  // Verificar gaps
  const positions = beforeState.map(a => a.posicion_general).sort((a, b) => a - b);
  const expectedPositions = Array.from({length: beforeState.length}, (_, i) => i + 1);

  if (JSON.stringify(positions) !== JSON.stringify(expectedPositions)) {
    console.log(`❌ GAPS DETECTADOS: Posiciones actuales [${positions.join(', ')}], esperadas [${expectedPositions.join(', ')}]`);

    // Identificar posición faltante
    for (let i = 1; i <= 6; i++) {
      if (!positions.includes(i)) {
        console.log(`🔴 Posición ${i} está VACÍA`);
      }
    }
  } else {
    console.log('✅ No hay gaps detectados');
  }

  console.log('\n🎯 ESTADO CORREGIDO: Con el nuevo algoritmo de empuje secuencial');
  console.log('   Al publicar nuevo artículo, las posiciones serían:');
  console.log('   - Posición 1: [NUEVO ARTÍCULO]');

  const articlesToReposition = beforeState.sort((a, b) => a.posicion_general - b.posicion_general);

  // Si hay 6 artículos, el último se archivaría
  if (articlesToReposition.length >= 6) {
    console.log(`   - ARCHIVADO: ${articlesToReposition[articlesToReposition.length - 1].title.substring(0, 40)}...`);
    articlesToReposition.pop(); // Remover último
  }

  // Reasignar posiciones secuenciales
  articlesToReposition.forEach((article, index) => {
    const newPosition = index + 2;
    console.log(`   - Posición ${newPosition}: ${article.title.substring(0, 40)}...`);
  });
}

// Ejecutar test
testPushAlgorithm().catch(console.error);