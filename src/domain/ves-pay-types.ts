export class VesPayType {
  id!: string;
  label!: string;

  constructor(partial?: Partial<VesPayType>) {
    Object.assign(this, partial);
  }
}

/** Identificadores `payTypes` habituales de Binance P2P para VES. */
export const VES_PAY_TYPES: VesPayType[] = [
  { id: 'Banesco', label: 'Banesco' },
  { id: 'Mercantil', label: 'Mercantil' },
  { id: 'BancoDeVenezuela', label: 'Banco de Venezuela' },
  { id: 'Provincial', label: 'BBVA Provincial' },
  { id: 'PagoMovil', label: 'Pago Móvil' },
  { id: 'Bancamiga', label: 'Bancamiga' },
  { id: 'Bancaribe', label: 'Bancaribe' },
  { id: 'BancoActivo', label: 'Banco Activo' },
  { id: 'BancoExterior', label: 'Banco Exterior' },
  { id: 'BNC', label: 'BNC' },
  { id: 'BancoPlaza', label: 'Banco Plaza' },
  { id: 'BancoDelTesoro', label: 'Banco del Tesoro' },
  { id: 'Sofitasa', label: 'Sofitasa' },
  { id: '100Banco', label: '100% Banco' },
  { id: 'VenezolanoDeCredito', label: 'Venezolano de Crédito' },
  { id: 'BancoFondoComun', label: 'Banco Fondo Común' },
  { id: 'DelSur', label: 'DelSur' },
  { id: 'Zinli', label: 'Zinli' },
  { id: 'Wally', label: 'Wally' },
  { id: 'Reserve', label: 'Reserve' },
];
