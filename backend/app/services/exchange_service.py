from decimal import Decimal
from datetime import datetime, timezone

import httpx

from app.core.config import settings


class ExchangeRateResult:
    def __init__(self, rate: Decimal, date: datetime):
        self.rate = rate
        self.date = date


async def get_usd_to_brl_rate() -> ExchangeRateResult | None:
    """Busca a cotação atual do dólar (USD → BRL)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.AWESOME_API_URL, timeout=10.0)
            response.raise_for_status()
            
            data = response.json()
            rate = Decimal(data["USDBRL"]["bid"])
            date = datetime.now(timezone.utc)
            
            return ExchangeRateResult(rate=rate, date=date)
    except Exception as e:
        print(f"Erro ao buscar cotação: {e}")
        return None


# Taxa fallback quando a API de cotações falha (evita 502 ao criar despesa em USD)
USD_BRL_FALLBACK_RATE = Decimal("5.50")


def get_usd_to_brl_rate_sync() -> ExchangeRateResult | None:
    """Versão síncrona para buscar cotação"""
    try:
        with httpx.Client() as client:
            response = client.get(settings.AWESOME_API_URL, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            # Awesome API: {"USDBRL": {"bid": "5.12", ...}}
            usd_brl = data.get("USDBRL") if isinstance(data, dict) else None
            if isinstance(usd_brl, dict):
                bid = usd_brl.get("bid") or usd_brl.get("ask")
                if bid is not None:
                    rate = Decimal(str(bid))
                    return ExchangeRateResult(rate=rate, date=datetime.now(timezone.utc))
    except Exception as e:
        print(f"Erro ao buscar cotação: {e}")
    return None


def convert_to_brl(value: Decimal, currency: str, exchange_rate: Decimal | None = None) -> tuple[Decimal, Decimal | None, datetime | None]:
    """
    Converte valor para BRL.
    Retorna: (value_brl, exchange_rate, exchange_rate_date)
    Para USD, se a API de cotação falhar, usa taxa fallback.
    """
    if currency == "BRL":
        return value, None, None

    if exchange_rate is None:
        result = get_usd_to_brl_rate_sync()
        if result is None:
            exchange_rate = USD_BRL_FALLBACK_RATE
            exchange_date = datetime.now(timezone.utc)
        else:
            exchange_rate = result.rate
            exchange_date = result.date
    else:
        exchange_date = datetime.now(timezone.utc)

    value_brl = value * exchange_rate
    return value_brl, exchange_rate, exchange_date