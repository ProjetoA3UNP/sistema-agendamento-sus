/**
 * Utilitário de validação e sanitização de CPF brasileiro
 */
export function limparDocumento(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function validarCpf(cpf: string): boolean {
  const limpo = limparDocumento(cpf);

  if (limpo.length !== 11) return false;
  // Bloquear sequências repetidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11), 10)) return false;

  return true;
}

export function mascararCpf(cpf: string): string {
  const limpo = limparDocumento(cpf);
  if (limpo.length !== 11) return '***.***.***-**';
  // Formato mascarado LGPD: ***.123.456-**
  return `***.${limpo.substring(3, 6)}.${limpo.substring(6, 9)}-**`;
}
