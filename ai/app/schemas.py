from pydantic import BaseModel


class MonthlySpending(BaseModel):
    categoria_id: str
    categoria: str
    mes: int       # 1–12
    ano: int
    total: float


class PredictRequest(BaseModel):
    user_id: str
    historico: list[MonthlySpending]


class PredictResult(BaseModel):
    categoria_id: str
    categoria: str
    valor_previsto: float
    variacao_percentual: float | None  # None quando não há mês anterior para comparar


class AnomalyRequest(BaseModel):
    user_id: str
    categoria_id: str
    valor: float
    historico_valores: list[float] = []  # valores históricos da categoria para comparação


class AnomalyResult(BaseModel):
    is_anomaly: bool
    score: float        # quantas vezes acima da média (ex: 2.3 = 130% acima)
    media_historica: float
