/**
 * Modelo de Dominio puro para una oferta P2P.
 * Agnóstico a cualquier proveedor externo (Binance, Bybit, etc.).
 * Solo contiene campos que el dominio de la aplicación necesita conocer.
 */

export interface PaymentMethod {
  /** Identificador técnico del método (ej. 'Banesco', 'PagoMovil') */
  id: string;
  /** Nombre legible del método de pago */
  name: string;
}

export interface OfferAdvertiser {
  /** Identificador único del anunciante */
  userNo: string;
  /** Nombre/nick del anunciante */
  nickName: string;
  /** Total de operaciones completadas históricamente */
  totalOrders: number;
  /** Tasa de completitud del último mes (0-1) */
  monthlyCompletionRate: number;
  /** Valoración positiva global (0-1) */
  positiveRate: number;
  /** Si el anunciante tiene estado de comerciante verificado */
  isProMerchant: boolean;
}

export interface P2POffer {
  /** ID único del anuncio en la plataforma de origen */
  advNo: string;
  /** Precio unitario en moneda fiat */
  price: number;
  /** Monto mínimo por transacción (en fiat) */
  minTransAmount: number;
  /** Monto máximo por transacción (en fiat) */
  maxTransAmount: number;
  /** Cantidad disponible del activo */
  availableAmount: number;
  /** Activo (ej. 'USDT', 'BTC') */
  asset: string;
  /** Moneda fiat (ej. 'VES', 'USD') */
  fiat: string;
  /** Tipo de operación desde perspectiva del anunciante */
  tradeType: 'BUY' | 'SELL';
  /** Métodos de pago aceptados */
  paymentMethods: PaymentMethod[];
  /** Información del anunciante */
  advertiser: OfferAdvertiser;
  /**
   * Indica si el anuncio es promocionado (privilegeType > 0).
   * Los anuncios promocionados son colocados en posiciones de destaque
   * y deben excluirse de los cálculos de precios de mercado.
   */
  isPromoted: boolean;
  /** Timestamp ISO de creación/actualización del anuncio */
  updatedAt: string | null;
}
