import { BIGMODEL_PROVIDER_ID } from "@skcode/shared";

const ACTIVE_PROVIDER_KEY = "oauth:active_provider";
const SKCODE_JWT_TOKEN_KEY = "skcodejwttoken";

interface BigModelStartPlanSkcodeJwtCredentialService {
  load(key: string): Promise<string | null>;
}

export async function resolveBigModelStartPlanSkcodeJwt(params: {
  credentialService?: BigModelStartPlanSkcodeJwtCredentialService;
  provider?: { readonly apiKey?: string | null } | null;
  trustCachedSkcodeJwt?: boolean;
}): Promise<string> {
  const activeProvider = (await params.credentialService?.load(ACTIVE_PROVIDER_KEY))?.trim() || "";
  if (params.trustCachedSkcodeJwt === true || activeProvider === BIGMODEL_PROVIDER_ID) {
    const credentialJwt =
      (await params.credentialService?.load(SKCODE_JWT_TOKEN_KEY))?.trim() || "";
    if (credentialJwt) {
      return credentialJwt;
    }
  }

  // skcode JWT 必须在 BigModel OAuth callback 阶段用授权码 body 落盘。
  // Start Plan 查询余额/运行时只消费已保存的 JWT 或 provider 副本，不再用
  // BigModel access_token 构造 provider+access_token body 临时兑换，避免 /oauth/token 400。
  return params.provider?.apiKey?.trim() || "";
}
