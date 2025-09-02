import { PartialType } from '@nestjs/mapped-types';
import { PostVagaLinkDto } from './post-vaga-link.dto';

export class PutVagaLinkDto extends PartialType(PostVagaLinkDto) {}
