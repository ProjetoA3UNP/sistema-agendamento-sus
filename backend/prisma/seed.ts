import { PrismaClient } from '@prisma/client';
import { semearBanco } from '../src/modules/vagas/vagas-seed.helper.js';

const prisma = new PrismaClient();

async function main() {
  const resultado = await semearBanco(prisma);
  console.log(`✅ Seed concluído! ${resultado.vagasCriadas} vagas criadas em ${resultado.ubss} UBSs.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
