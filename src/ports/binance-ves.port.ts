export abstract class BinanceVesPort {
    abstract getBinanceOffers(): Promise<any>;
}