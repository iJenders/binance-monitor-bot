/**
 * DTOs de infraestructura que representan la respuesta cruda de la API de Binance P2P.
 * Estos tipos están acoplados al contrato externo de Binance y SOLO deben
 * usarse dentro de los Adaptadores. El Dominio nunca debe importar desde aquí.
 */

export interface BinanceTradeMethodDto {
  payId?: string | number | null;
  payMethodId?: string | null;
  payType?: string | null;
  payAccount?: string | null;
  payBank?: string | null;
  paySubBank?: string | null;
  identifier?: string | null;
  iconUrlColor?: string | null;
  tradeMethodName?: string | null;
  tradeMethodShortName?: string | null;
  tradeMethodBgColor?: string | null;
}

export interface BinanceAdvDto {
  advNo?: string | null;
  classify?: string | null;
  tradeType?: string | null;
  asset?: string | null;
  fiatUnit?: string | null;
  advStatus?: number | string | null;
  priceType?: number | string | null;
  price?: string | null;
  initAmount?: string | number | null;
  surplusAmount?: string | null;
  tradableQuantity?: string | null;
  maxSingleTransAmount?: string | null;
  minSingleTransAmount?: string | null;
  remarks?: string | null;
  autoReplyMsg?: string | null;
  payTimeLimit?: number | null;
  tradeMethods?: BinanceTradeMethodDto[] | null;
  userBuyTradeCountMin?: number | null;
  userBuyTradeCountMax?: number | null;
  userSellTradeCountMin?: number | null;
  userSellTradeCountMax?: number | null;
  userAllTradeCountMin?: number | null;
  userAllTradeCountMax?: number | null;
  userTradeCompleteCountMin?: number | null;
  userTradeCompleteRateMin?: number | null;
  userTradeVolumeMin?: number | null;
  userTradeVolumeMax?: number | null;
  userTradeVolumeAsset?: string | null;
  createTime?: number | string | null;
  advUpdateTime?: number | string | null;
  isTradable?: boolean | null;
  dynamicMaxSingleTransAmount?: string | null;
  minSingleTransQuantity?: string | null;
  maxSingleTransQuantity?: string | null;
  dynamicMaxSingleTransQuantity?: string | null;
  commissionRate?: string | number | null;
  takerCommissionRate?: string | number | null;
  launchCountry?: string | null;
  closeReason?: string | null;
  allowTradeMerchant?: boolean | null;
  isSafePayment?: boolean | null;
  privilegeType?: number | null;
  redirectLink?: string | null;
  redirectDeeplink?: string | null;
  [key: string]: unknown;
}

export interface BinanceAdvertiserDto {
  userNo?: string | null;
  realName?: string | null;
  nickName?: string | null;
  margin?: string | number | null;
  marginUnit?: string | null;
  orderCount?: number | null;
  monthOrderCount?: number | null;
  monthFinishRate?: number | null;
  positiveRate?: number | null;
  advConfirmTime?: number | string | null;
  email?: string | null;
  registrationTime?: number | string | null;
  mobile?: string | null;
  userType?: string | null;
  tagIconUrls?: string[] | null;
  userGrade?: number | null;
  userIdentity?: string | null;
  proMerchant?: boolean | null;
  badges?: string[] | null;
  vipLevel?: number | null;
  isBlocked?: boolean | null;
  activeTimeInSecond?: number | null;
  merchantGroupMember?: boolean | null;
  redirectLink?: string | null;
  redirectDeeplink?: string | null;
}

/** Representa un anuncio tal como lo retorna la API de Binance. */
export interface BinanceAdvertisingDto {
  adv?: BinanceAdvDto | null;
  advertiser?: BinanceAdvertiserDto | null;
  privilegeDesc?: string | null;
  privilegeType?: number | null;
  privilegeTypeAdTotalCount?: number | null;
}
