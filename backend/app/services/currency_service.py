import logging
from datetime import datetime, timedelta
import httpx
from typing import Dict, List, Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback rates relative to USD if external API is unreachable or rate-limited
FALLBACK_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "INR": 83.15,
    "CAD": 1.35,
    "AUD": 1.52,
    "JPY": 151.20,
}

# In-memory cache
_rate_cache: Dict[str, float] = {}
_cache_updated_at: Optional[datetime] = None
CACHE_TTL = timedelta(hours=1)


class CurrencyService:
    @staticmethod
    async def fetch_exchange_rates() -> Dict[str, float]:
        global _rate_cache, _cache_updated_at
        now = datetime.utcnow()

        if _rate_cache and _cache_updated_at and (now - _cache_updated_at < CACHE_TTL):
            return _rate_cache

        rates = dict(FALLBACK_RATES)

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(settings.EXCHANGE_RATE_API_URL)
                if response.status_code == 200:
                    data = response.json()
                    fetched_rates = data.get("rates", {})
                    if fetched_rates:
                        for curr, rate in fetched_rates.items():
                            rates[curr] = float(rate)
                        logger.info("Successfully fetched live exchange rates from ExchangeRate API")
        except Exception as e:
            logger.warning(f"Failed to fetch exchange rates from API: {e}. Using cached/fallback rates.")

        # Try REST Countries API to enrich currency list if needed
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(settings.REST_COUNTRIES_API_URL)
                if res.status_code == 200:
                    countries = res.json()
                    for country in countries:
                        currencies = country.get("currencies", {})
                        for code in currencies.keys():
                            if code not in rates:
                                rates[code] = 1.0  # Default 1:1 fallback for missing rates
        except Exception as e:
            logger.warning(f"Failed to fetch REST Countries currencies: {e}")

        _rate_cache = rates
        _cache_updated_at = now
        return rates

    @staticmethod
    async def get_supported_currencies() -> List[Dict[str, Any]]:
        rates = await CurrencyService.fetch_exchange_rates()
        currencies = [
            {"code": "USD", "name": "US Dollar", "symbol": "$", "rate_to_usd": rates.get("USD", 1.0)},
            {"code": "EUR", "name": "Euro", "symbol": "€", "rate_to_usd": rates.get("EUR", 0.92)},
            {"code": "GBP", "name": "British Pound", "symbol": "£", "rate_to_usd": rates.get("GBP", 0.79)},
            {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "rate_to_usd": rates.get("INR", 83.15)},
            {"code": "CAD", "name": "Canadian Dollar", "symbol": "CA$", "rate_to_usd": rates.get("CAD", 1.35)},
            {"code": "AUD", "name": "Australian Dollar", "symbol": "A$", "rate_to_usd": rates.get("AUD", 1.52)},
            {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "rate_to_usd": rates.get("JPY", 151.20)},
        ]
        return currencies

    @staticmethod
    async def convert_amount(amount: float, from_curr: str, to_curr: str) -> Dict[str, Any]:
        rates = await CurrencyService.fetch_exchange_rates()

        from_rate = rates.get(from_curr.upper(), 1.0)
        to_rate = rates.get(to_curr.upper(), 1.0)

        # Convert from_curr -> USD -> to_curr
        usd_amount = amount / from_rate if from_rate > 0 else amount
        converted_amount = usd_amount * to_rate

        effective_rate = to_rate / from_rate if from_rate > 0 else 1.0

        return {
            "original_amount": amount,
            "original_currency": from_curr,
            "converted_amount": round(converted_amount, 2),
            "target_currency": to_curr,
            "exchange_rate": round(effective_rate, 4),
            "updated_at": _cache_updated_at.isoformat() if _cache_updated_at else datetime.utcnow().isoformat()
        }
