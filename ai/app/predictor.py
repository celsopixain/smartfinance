import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from app.schemas import MonthlySpending, PredictResult


def _weighted_moving_average(values: list[float], weights: list[float]) -> float:
    """Média Móvel Ponderada — meses mais recentes têm peso maior."""
    total_weight = sum(weights[:len(values)])
    return sum(v * w for v, w in zip(values, weights)) / total_weight if total_weight else 0.0


def predict_next_month(historico: list[MonthlySpending]) -> list[PredictResult]:
    """
    Recebe histórico de gastos mensais agrupados por categoria e retorna
    a projeção do mês seguinte.

    Estratégia:
    - 1 ou 2 meses de dados  → Média Móvel Ponderada (mais simples, menos ruído)
    - 3+ meses de dados      → Regressão Linear Simples (captura tendência)
    """
    if not historico:
        return []

    df = pd.DataFrame([h.model_dump() for h in historico])
    # Cria coluna de período ordinal para regressão
    df["periodo"] = df["ano"] * 12 + df["mes"]

    results: list[PredictResult] = []

    for categoria_id, grupo in df.groupby("categoria_id"):
        grupo = grupo.sort_values("periodo")
        totais = grupo["total"].tolist()
        categoria_nome = grupo["categoria"].iloc[-1]

        ultimo_total = totais[-1]

        if len(totais) >= 3:
            # Regressão Linear sobre os períodos
            X = grupo["periodo"].values.reshape(-1, 1)
            y = grupo["total"].values
            model = LinearRegression().fit(X, y)
            proximo_periodo = grupo["periodo"].max() + 1
            valor_previsto = float(max(0, model.predict([[proximo_periodo]])[0]))
        else:
            # Média Móvel Ponderada: meses mais recentes com peso maior
            pesos = list(range(1, len(totais) + 1))
            valor_previsto = _weighted_moving_average(totais, pesos)

        # Variação percentual em relação ao último mês
        if ultimo_total and ultimo_total > 0:
            variacao = ((valor_previsto - ultimo_total) / ultimo_total) * 100
        else:
            variacao = None

        results.append(PredictResult(
            categoria_id=str(categoria_id),
            categoria=categoria_nome,
            valor_previsto=round(valor_previsto, 2),
            variacao_percentual=round(variacao, 2) if variacao is not None else None,
        ))

    return results


def detect_anomaly(valor: float, historico_categoria: list[float]) -> tuple[bool, float, float]:
    """
    Detecta se um valor é anômalo para a categoria.
    Retorna: (is_anomaly, score, media_historica)

    Score = valor / média (ex: 2.5 = 150% acima da média)
    Limiar: score >= 2.0 é considerado anomalia.
    """
    if not historico_categoria:
        return False, 1.0, 0.0

    media = float(np.mean(historico_categoria))
    if media <= 0:
        return False, 1.0, 0.0

    score = valor / media
    is_anomaly = score >= 2.0

    return is_anomaly, round(score, 4), round(media, 2)
