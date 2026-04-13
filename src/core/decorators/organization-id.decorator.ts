import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser = {
  user?: {
    organizationId?: string | number | null;
    userDetail?: {
      organizationId?: string | number | null;
    };
  };
};

export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | number | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user?.userDetail?.organizationId ?? request.user?.organizationId ?? null;
  },
);

