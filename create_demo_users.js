const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const professors = await prisma.$queryRawUnsafe(
    'SELECT id, nome_completo FROM `20261_prjint5_gabrielsantos`.`professor` ORDER BY created_at DESC LIMIT 1'
  );
  const alunos = await prisma.$queryRawUnsafe(
    'SELECT id, nome_completo FROM `20261_prjint5_raphaelestrella`.`aluno` ORDER BY created_at DESC LIMIT 1'
  );

  const prof = professors[0];
  const aluno = alunos[0];

  if (!prof) { console.error('Nenhum professor encontrado. Rode a collection primeiro.'); process.exit(1); }
  if (!aluno) { console.error('Nenhum aluno encontrado. Rode a collection primeiro.'); process.exit(1); }

  console.log('Professor:', prof.nome_completo, '| ID:', prof.id);
  console.log('Aluno:', aluno.nome_completo, '| ID:', aluno.id);

  const profHash = await bcrypt.hash('Prof@123', 10);
  const alunoHash = await bcrypt.hash('Aluno@123', 10);

  // Remove se já existir (para poder recriar)
  await prisma.$executeRawUnsafe("DELETE FROM usuario WHERE email IN ('professor@escola.com', 'aluno@escola.com')");

  await prisma.$executeRawUnsafe(
    `INSERT INTO usuario (id, email, senha_hash, role, referencia_id) VALUES (UUID(), 'professor@escola.com', '${profHash}', 'PROFESSOR', '${prof.id}')`
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO usuario (id, email, senha_hash, role, referencia_id) VALUES (UUID(), 'aluno@escola.com', '${alunoHash}', 'ALUNO', '${aluno.id}')`
  );

  const criados = await prisma.$queryRawUnsafe(
    "SELECT email, role, ativo FROM usuario WHERE email IN ('professor@escola.com', 'aluno@escola.com')"
  );
  console.log('\nUsuarios criados com sucesso:');
  criados.forEach(u => console.log(' -', u.email, '|', u.role, '| ativo:', u.ativo));

  await prisma.$disconnect();
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
