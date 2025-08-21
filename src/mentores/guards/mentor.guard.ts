import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { MentoresService } from '../mentores.service';

@Injectable()
export class MentorGuard implements CanActivate {
  constructor(private readonly mentoresService: MentoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string; email: string } | undefined;

    if (!user?.id) throw new ForbiddenException('Acesso restrito a mentores');

    const isMentor = await this.mentoresService.isMentor(user.id);
    if (!isMentor) throw new ForbiddenException('Apenas mentores podem executar esta ação');

    return true;
    }
}
