export class TradeMethod {
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

  constructor(partial?: Partial<TradeMethod>) {
    Object.assign(this, partial);
  }
}

export class Adv {
  advNo?: string | null;
  classify?: string | null;
  tradeType?: string | null;
  asset?: string | null;
  fiatUnit?: string | null;
  advStatus?: number | string | null;
  priceType?: number | string | null;
  priceFloatingRatio?: string | number | null;
  rateFloatingRatio?: string | number | null;
  currencyRate?: string | number | null;
  price?: string | null;
  initAmount?: string | number | null;
  surplusAmount?: string | null;
  tradableQuantity?: string | null;
  amountAfterEditing?: string | number | null;
  maxSingleTransAmount?: string | null;
  minSingleTransAmount?: string | null;
  buyerKycLimit?: number | null;
  buyerRegDaysLimit?: number | null;
  buyerBtcPositionLimit?: number | null;
  remarks?: string | null;
  autoReplyMsg?: string | null;
  payTimeLimit?: number | null;
  tradeMethods?: TradeMethod[] | null;
  userTradeCountFilterTime?: number | null;
  userBuyTradeCountMin?: number | null;
  userBuyTradeCountMax?: number | null;
  userSellTradeCountMin?: number | null;
  userSellTradeCountMax?: number | null;
  userAllTradeCountMin?: number | null;
  userAllTradeCountMax?: number | null;
  userTradeCompleteRateFilterTime?: number | null;
  userTradeCompleteCountMin?: number | null;
  userTradeCompleteRateMin?: number | null;
  userTradeVolumeFilterTime?: number | null;
  userTradeType?: string | null;
  userTradeVolumeMin?: number | null;
  userTradeVolumeMax?: number | null;
  userTradeVolumeAsset?: string | null;
  createTime?: number | string | null;
  advUpdateTime?: number | string | null;
  fiatVo?: any | null;
  assetVo?: any | null;
  advVisibleRet?: any | null;
  takerAdditionalKycRequired?: number | null;
  minFiatAmountForAdditionalKyc?: string | number | null;
  inventoryType?: string | number | null;
  offlineReason?: string | null;
  voucherTemplate?: any | null;
  assetLogo?: string | null;
  assetScale?: number | null;
  fiatScale?: number | null;
  priceScale?: number | null;
  fiatSymbol?: string | null;
  isTradable?: boolean | null;
  dynamicMaxSingleTransAmount?: string | null;
  minSingleTransQuantity?: string | null;
  maxSingleTransQuantity?: string | null;
  dynamicMaxSingleTransQuantity?: string | null;
  commissionRate?: string | number | null;
  takerCommissionRate?: string | number | null;
  minTakerFee?: string | number | null;
  tradeMethodCommissionRates?: any | null;
  launchCountry?: string | null;
  abnormalStatusList?: any | null;
  closeReason?: string | null;
  storeInformation?: any | null;
  allowTradeMerchant?: boolean | null;
  adTradeInstructionTagInfoRets?: any | null;
  isSafePayment?: boolean | null;
  adAdditionalKycVerifyItems?: any | null;
  isStarTraderAdditionalKycExclusion?: boolean | null;
  isStarTraderCounterpartyConditionsExclusion?: boolean | null;
  nonTradableRegions?: any | null;
  invisibleType?: string | number | null;
  invisibleTitle?: string | null;
  invisibleReason?: string | null;
  privilegeType?: number | null;
  advSystemLabelRet?: any | null;
  redirectLink?: string | null;
  redirectDeeplink?: string | null;

  constructor(partial?: Partial<Adv>) {
    Object.assign(this, partial);
  }
}

export class Advertiser {
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

  constructor(partial?: Partial<Advertiser>) {
    Object.assign(this, partial);
  }
}

export class Advertising {
  adv?: Adv | null;
  advertiser?: Advertiser | null;
  privilegeDesc?: string | null;
  privilegeType?: number | null;
  privilegeTypeAdTotalCount?: number | null;

  constructor(partial?: Partial<Advertising>) {
    Object.assign(this, partial);
  }
}