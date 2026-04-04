import os
from fastapi import FastAPI, HTTPException
from app.schemas import PredictRequest, AnomalyRequest, AnomalyResult
from app.predictor import predict_next_month, detect_anomaly

# Swagger/ReDoc desabilitados em produção — o serviço é interno (NestJS → FastAPI)
_is_prod = os.getenv("APP_ENV", "development") == "production"

app = FastAPI(
    title="SmartFinance AI Service",
    version="1.0.0",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)


@app.get("/health")
def health_check():
    """Health check para o Render monitorar o serviço."""
    return {"status": "ok", "service": "smartfinance-ai"}


@app.post("/predict")
def predict(request: PredictRequest):
    """
    Recebe histórico de gastos mensais por categoria e retorna
    a projeção de gastos para o próximo mês.
    """
    if not request.historico:
        raise HTTPException(status_code=422, detail="Histórico vazio — sem dados para predição.")

    results = predict_next_month(request.historico)
    return {"user_id": request.user_id, "predicoes": [r.model_dump() for r in results]}


@app.post("/anomaly", response_model=AnomalyResult)
def anomaly(request: AnomalyRequest):
    """
    Verifica se um valor de transação é anômalo para a categoria do usuário.
    Recebe o valor atual e o histórico de valores da categoria.
    """
    if request.valor <= 0:
        raise HTTPException(status_code=422, detail="Valor deve ser maior que zero.")

    # O NestJS envia o histórico de valores da categoria embutido no request
    # (campo opcional historico_valores). Se ausente, usa lista vazia.
    historico = getattr(request, "historico_valores", []) or []

    is_anomaly, score, media = detect_anomaly(request.valor, historico)
    return AnomalyResult(is_anomaly=is_anomaly, score=score, media_historica=media)
