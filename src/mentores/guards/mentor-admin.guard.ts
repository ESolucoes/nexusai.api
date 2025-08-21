import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { MentoresService } from '../mentores.service';

@Injectable()
export class MentorAdminGuard implements CanActivate {
  constructor(private readonly mentoresService: MentoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string; email: string } | undefined;

    if (!user?.id) throw new ForbiddenException('Acesso restrito a mentores admin');

    const isAdmin = await this.mentoresService.isAdmin(user.id);
    if (!isAdmin) throw new ForbiddenException('Apenas mentores admin podem alterar o tipo de mentor');

    return true;
  }
}
