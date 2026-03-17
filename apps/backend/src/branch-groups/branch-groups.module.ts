import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { BranchGroupEntity } from './entities/branch-group.entity';
import { BranchGroupMemberEntity } from './entities/branch-group-member.entity';
import { BranchGroupsController } from './branch-groups.controller';
import { BranchGroupsService } from './branch-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BranchGroupEntity, BranchGroupMemberEntity]),
    AuthModule,
    RbacModule,
  ],
  controllers: [BranchGroupsController],
  providers: [BranchGroupsService],
  exports: [BranchGroupsService],
})
export class BranchGroupsModule {}
