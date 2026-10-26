/**
 * Utilitários de formatação e máscaras de entrada
 */
export function formatarCpf(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11);
  if (limpo.length <= 3) return limpo;
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

export function formatarCartaoSus(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 15);
  if (limpo.length <= 3) return limpo;
  if (limpo.length <= 7) return `${limpo.slice(0, 3)} ${limpo.slice(3)}`;
  if (limpo.length <= 11) return `${limpo.slice(0, 3)} ${limpo.slice(3, 7)} ${limpo.slice(7)}`;
  return `${limpo.slice(0, 3)} ${limpo.slice(3, 7)} ${limpo.slice(7, 11)} ${limpo.slice(11, 15)}`;
}

export function formatarTelefone(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 11);
  if (limpo.length <= 2) return limpo;
  if (limpo.length <= 7) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
}

export const BAIRROS_NATAL = [
  // Distrito Sul
  'Ponta Negra',
  'Candelária',
  'Capim Macio',
  'Neópolis',
  'Lagoa Nova',
  'Nova Descoberta',
  'Pitimbu',
  // Distrito Leste
  'Tirol',
  'Petrópolis',
  'Praia do Meio',
  'Brasília Teimosa',
  'Rocas',
  'Santos Reis',
  'Alecrim',
  'Barro Vermelho',
  'Mãe Luiza',
  // Distrito Norte
  'Pajuçara',
  'Lagoa Azul',
  'Potengi',
  'Redinha',
  'Igapó',
  'Nossa Senhora da Apresentação',
  // Distrito Oeste
  'Felipe Camarão',
  'Bom Pastor',
  'Dix-Sept Rosado',
  'Nazaré',
  'Quintas',
  'Cidade da Esperança',
  'Cidade Nova',
];
