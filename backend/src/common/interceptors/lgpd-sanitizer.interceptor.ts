import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { mascararCpf } from '../utils/cpf.validator.js';

@Injectable()
export class LgpdSanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.sanitizar(data)),
    );
  }

  private sanitizar(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizar(item));
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      const sanitizado: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        // Nunca retornar hash de senha
        if (key === 'senha' || key === 'senhaHash' || key === 'password') {
          continue;
        }

        // Mascarar CPF para conformidade LGPD
        if (key === 'cpf' && typeof value === 'string') {
          sanitizado[key] = mascararCpf(value);
          continue;
        }

        if (typeof value === 'object' && value !== null) {
          sanitizado[key] = this.sanitizar(value);
        } else {
          sanitizado[key] = value;
        }
      }

      return sanitizado;
    }

    return data;
  }
}
