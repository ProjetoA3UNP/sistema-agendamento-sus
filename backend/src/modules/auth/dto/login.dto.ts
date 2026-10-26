import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'joao.silva@email.com',
    description: 'E-mail cadastrado ou CPF do cidadão/funcionário',
  })
  @IsString({ message: 'O login deve ser uma string.' })
  @IsNotEmpty({ message: 'Informe seu e-mail ou CPF para entrar.' })
  identificador: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha de acesso' })
  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha possui no mínimo 6 caracteres.' })
  senha: string;
}
