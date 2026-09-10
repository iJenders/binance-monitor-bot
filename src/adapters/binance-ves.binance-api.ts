import { Injectable } from "@nestjs/common";
import { BinanceVesPort } from "../ports/binance-ves.port.js";
import { Advertising } from "../domain/advertising.js";

@Injectable()
export class BinanceAdapter implements BinanceVesPort {
    // =========================
    // Binance P2P
    // =========================
    public async getBinanceOffers(): Promise<Advertising[]> {

        const binanceUrl = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

        const body = {
            "fiat": "VES",
            "page": 1,
            "rows": 20,
            "tradeType": "BUY",
            "asset": "USDT",
            "countries": [],
            "proMerchantAds": false,
            "shieldMerchantAds": false,
            "filterType": "tradable",
            "periods": [],
            "additionalKycVerifyFilter": 0,
            "publisherType": "merchant",
            "payTypes": [],
            "classifies": [
                "mass",
                "profession",
                "fiat_trade"
            ],
            "tradedWith": false,
            "followed": false
        };

        try {
            const res = await fetch(binanceUrl, {
                method: "POST",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0",
                }
            });

            const raw = await res.text();
            const json = JSON.parse(raw);

            if (
                json &&
                json.code === "000000" &&
                Array.isArray(json.data) &&
                json.data.length > 0
            ) {
                return json.data;
            } else {
                throw new Error("Respuesta de Binance sin datos válidos");
            }
        } catch (e) {
            throw new Error("Error consultando Binance P2P: " + e);
        }
    }

}